import { Response } from 'express';
import { pool } from '../config/db';
import { triggerCrmWebhook } from '../services/webhookService';

// 0. Fetch all sales representatives for assignment dropdown
export const getSalesAgents = async (req: any, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role FROM users ORDER BY name ASC'
    );
    res.status(200).json({ success: true, agents: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 1. Fetch deals pipeline data based on user authorization hierarchy
export const getDeals = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const userRole = (req.user.role || '').toLowerCase();
    const isExecutive = userRole === 'admin' || userRole === 'ceo' || userRole === 'cfo';

    let query = 'SELECT * FROM deals WHERE user_id = $1 ORDER BY id DESC';
    let params: any[] = [userId];

    if (isExecutive) {
      query = 'SELECT * FROM deals ORDER BY id DESC';
      params = [];
    }

    const result = await pool.query(query, params);

    const formattedDeals = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      company: row.company,
      contactName: row.contact_person || '',
      value: Number(row.value) || 0,
      currency: row.currency || 'USD',
      stage: row.stage || 'Lead In',
      priority: row.priority || 'Medium',
      dueDate: row.closing_date || '',
      assignedTo: row.user_id,
      documentUrl: row.document_url || '',
      documentName: row.document_name || '',
    }));

    res.status(200).json({ success: true, deals: formattedDeals });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Create new deal, dispatch in-app notification and trigger automation if won
export const createDeal = async (req: any, res: Response): Promise<void> => {
  try {
    const creatorUserId = req.user.id;
    const creatorName = req.user.name || 'Management';

    const {
      title,
      company,
      contactName,
      contact_person,
      value,
      currency,
      stage,
      priority,
      dueDate,
      closing_date,
      assigned_to,
      assignedTo,
      documentUrl,
      documentName,
      document_url,
      document_name,
    } = req.body;

    const person = contactName || contact_person || '';
    const date = dueDate || closing_date || '';
    const dealCurrency = currency || 'USD';
    const docUrl = documentUrl || document_url || null;
    const docName = documentName || document_name || null;
    const targetUserId = assigned_to || assignedTo || creatorUserId;

    // Insert new deal record into PostgreSQL database
    const result = await pool.query(
      `INSERT INTO deals (user_id, title, company, contact_person, value, currency, stage, priority, closing_date, document_url, document_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [targetUserId, title, company, person, value || 0, dealCurrency, stage || 'Lead In', priority || 'Medium', date, docUrl, docName]
    );

    const saved = result.rows[0];

    // Trigger n8n webhook automation if deal is created directly in Won stage
    const isWon = saved.stage?.toLowerCase() === 'won' || saved.stage?.toLowerCase() === 'won / closed';
    if (isWon) {
      triggerCrmWebhook(
        'deal.won',
        {
          dealId: saved.id,
          title: saved.title,
          company: saved.company,
          contactPerson: saved.contact_person,
          value: Number(saved.value) || 0,
          currency: saved.currency,
          stage: saved.stage,
          priority: saved.priority,
          closingDate: saved.closing_date,
          documentUrl: saved.document_url,
          documentName: saved.document_name,
        },
        req.user
      );
    }

    // Persist in-app assignment notification into PostgreSQL
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, channel, title, description, link, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, FALSE, NOW())`,
        [
          targetUserId,
          'deal',
          'New Deal Assigned',
          `Deal "${title}" at ${company || 'Client'} has been assigned to you by ${creatorName}.`,
          '/deals',
        ]
      );
    } catch (notifErr) {
      console.error('Failed to trigger database notification:', notifErr);
    }

    res.status(201).json({
      success: true,
      deal: {
        id: saved.id,
        title: saved.title,
        company: saved.company,
        contactName: saved.contact_person || '',
        value: Number(saved.value) || 0,
        currency: saved.currency || 'USD',
        stage: saved.stage,
        priority: saved.priority,
        dueDate: saved.closing_date || '',
        assignedTo: saved.user_id,
        documentUrl: saved.document_url || '',
        documentName: saved.document_name || '',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Update existing deal and dispatch n8n automation webhook when transitioned to Won
export const updateDeal = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const userRole = (req.user.role || '').toLowerCase();
    const isExecutive = userRole === 'admin' || userRole === 'ceo' || userRole === 'cfo';

    const { id } = req.params;
    const {
      title,
      company,
      contactName,
      contact_person,
      value,
      currency,
      stage,
      priority,
      dueDate,
      closing_date,
      documentUrl,
      documentName,
      document_url,
      document_name,
    } = req.body;

    const person = contactName !== undefined ? contactName : contact_person;
    const date = dueDate !== undefined ? dueDate : closing_date;
    const docUrl = documentUrl !== undefined ? documentUrl : document_url;
    const docName = documentName !== undefined ? documentName : document_name;

    const condition = isExecutive ? 'WHERE id = $11' : 'WHERE id = $11 AND user_id = $12';
    const params: any[] = [title, company, person, value, currency, stage, priority, date, docUrl, docName, id];
    if (!isExecutive) params.push(userId);

    const result = await pool.query(
      `UPDATE deals 
       SET title = COALESCE($1, title),
           company = COALESCE($2, company),
           contact_person = COALESCE($3, contact_person),
           value = COALESCE($4, value),
           currency = COALESCE($5, currency),
           stage = COALESCE($6, stage),
           priority = COALESCE($7, priority),
           closing_date = COALESCE($8, closing_date),
           document_url = COALESCE($9, document_url),
           document_name = COALESCE($10, document_name)
       ${condition}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Deal not found' });
      return;
    }

    const updated = result.rows[0];

    // Trigger n8n webhook automation when deal transitions into Won stage
    const isWon = stage && (stage.toLowerCase() === 'won' || stage.toLowerCase() === 'won / closed');
    if (isWon) {
      triggerCrmWebhook(
        'deal.won',
        {
          dealId: updated.id,
          title: updated.title,
          company: updated.company,
          contactPerson: updated.contact_person,
          value: Number(updated.value) || 0,
          currency: updated.currency,
          stage: updated.stage,
          priority: updated.priority,
          closingDate: updated.closing_date,
          documentUrl: updated.document_url,
          documentName: updated.document_name,
        },
        req.user
      );
    }

    res.status(200).json({
      success: true,
      deal: {
        id: updated.id,
        title: updated.title,
        company: updated.company,
        contactName: updated.contact_person || '',
        value: Number(updated.value) || 0,
        currency: updated.currency || 'USD',
        stage: updated.stage,
        priority: updated.priority,
        dueDate: updated.closing_date || '',
        assignedTo: updated.user_id,
        documentUrl: updated.document_url || '',
        documentName: updated.document_name || '',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Delete deal record from PostgreSQL
export const deleteDeal = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const userRole = (req.user.role || '').toLowerCase();
    const isExecutive = userRole === 'admin' || userRole === 'ceo' || userRole === 'cfo';
    const { id } = req.params;

    const condition = isExecutive ? 'WHERE id = $1' : 'WHERE id = $1 AND user_id = $2';
    const params = isExecutive ? [id] : [id, userId];

    const result = await pool.query(
      `DELETE FROM deals ${condition} RETURNING id`,
      params
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Deal could not be deleted' });
      return;
    }

    res.status(200).json({ success: true, message: 'Deal deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};