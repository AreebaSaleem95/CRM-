import { Response } from 'express';
import { pool } from '../config/db';

// 0. Get all sales agents / team members for CEO / Manager assignment dropdown
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

// 1. Get deals (CEO/Admin sees all company deals, Sales Agent sees assigned deals)
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
      stage: row.stage || 'Lead In',
      priority: row.priority || 'Medium',
      dueDate: row.closing_date || '',
      assignedTo: row.user_id,
    }));

    res.status(200).json({ success: true, deals: formattedDeals });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Create new deal & automatically dispatch notification to assigned agent
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
      stage, 
      priority, 
      dueDate, 
      closing_date,
      assigned_to,
      assignedTo
    } = req.body;

    const person = contactName || contact_person || '';
    const date = dueDate || closing_date || '';
    
 
    const targetUserId = assigned_to || assignedTo || creatorUserId;

    // 1. Insert Deal into database
    const result = await pool.query(
      `INSERT INTO deals (user_id, title, company, contact_person, value, stage, priority, closing_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [targetUserId, title, company, person, value || 0, stage || 'Lead In', priority || 'Medium', date]
    );

    const saved = result.rows[0];

    // 2. Insert In-App Notification into PostgreSQL table
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, channel, title, description, link, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, FALSE, NOW())`,
        [
          targetUserId,
          'deal',
          'New Deal Assigned',
          `Deal "${title}" at ${company || 'Client'} has been assigned to you by ${creatorName}.`,
          '/deals'
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
        stage: saved.stage,
        priority: saved.priority,
        dueDate: saved.closing_date || '',
        assignedTo: saved.user_id,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Update deal
export const updateDeal = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const userRole = (req.user.role || '').toLowerCase();
    const isExecutive = userRole === 'admin' || userRole === 'ceo' || userRole === 'cfo';

    const { id } = req.params;
    const { title, company, contactName, contact_person, value, stage, priority, dueDate, closing_date } = req.body;

    const person = contactName !== undefined ? contactName : contact_person;
    const date = dueDate !== undefined ? dueDate : closing_date;

    const condition = isExecutive ? 'WHERE id = $8' : 'WHERE id = $8 AND user_id = $9';
    const params = [title, company, person, value, stage, priority, date, id];
    if (!isExecutive) params.push(userId);

    const result = await pool.query(
      `UPDATE deals 
       SET title = COALESCE($1, title),
           company = COALESCE($2, company),
           contact_person = COALESCE($3, contact_person),
           value = COALESCE($4, value),
           stage = COALESCE($5, stage),
           priority = COALESCE($6, priority),
           closing_date = COALESCE($7, closing_date)
       ${condition}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Deal nahi mili' });
      return;
    }

    const updated = result.rows[0];
    res.status(200).json({
      success: true,
      deal: {
        id: updated.id,
        title: updated.title,
        company: updated.company,
        contactName: updated.contact_person || '',
        value: Number(updated.value) || 0,
        stage: updated.stage,
        priority: updated.priority,
        dueDate: updated.closing_date || '',
        assignedTo: updated.user_id,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Delete deal
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
      res.status(404).json({ success: false, message: 'Deal delete nahi ho saki' });
      return;
    }

    res.status(200).json({ success: true, message: 'Deal deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};