import { Response } from 'express';
import { pool } from '../../config/db';

// n8n Automated CRM Webhook Caller (Gmail + Google Sheets + Telegram)
const triggerCrmWebhook = async (dealData: any) => {
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://crm-enterprise.app.n8n.cloud/webhook/a7dc6408-79e1-45f1-8b4c-47b2b72e128c';
    if (!webhookUrl) return;

    const person = dealData.contact_person || dealData.contact_name || dealData.contactPerson || dealData.company || 'Direct Client';
    const cleanDate = formatDateSafe(dealData.closing_date || dealData.expected_close || dealData.due_date || new Date());
    const valNumber = Number(dealData.value) || 0;
    const docLink = dealData.document_url || dealData.documentUrl || '';
    const compName = dealData.company || 'Client Account';
    const dealTitle = dealData.title || 'Sales Deal';
    const cur = dealData.currency || 'PKR';
    const formattedRevenue = `${cur} ${valNumber.toLocaleString()}`;

    // Har Mumkin Variable Send Kar Rahe Hain (Taaki n8n me koi bhi key blank na rahe)
    const payload = {
      event: 'DEAL_WON',
      // ID formats
      id: dealData.id,
      dealId: dealData.id,
      deal_id: dealData.id,
      // Title formats
      title: dealTitle,
      dealTitle: dealTitle,
      deal_title: dealTitle,
      name: dealTitle,
      // Company formats
      company: compName,
      companyName: compName,
      company_name: compName,
      client: compName,
      // Contact Person formats
      contactPerson: person,
      contact_person: person,
      contactName: person,
      contact_name: person,
      clientContact: person,
      client_contact: person,
      // Revenue / Value formats
      value: valNumber,
      amount: valNumber,
      revenue: formattedRevenue,
      deal_value: valNumber,
      deal_revenue: formattedRevenue,
      currency: cur,
      // Date formats
      date: cleanDate,
      dueDate: cleanDate,
      closingDate: cleanDate,
      closing_date: cleanDate,
      closedAt: cleanDate,
      // Document Link
      documentUrl: docLink,
      document_url: docLink,
      proposalUrl: docLink
    };

    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Enterprise-CRM-Engine/1.0'
      },
      body: JSON.stringify(payload)
    })
    .then((res) => {
      if (res.ok) {
        console.log(`[n8n Webhook] Deal "${dealTitle}" Won notification dispatched successfully!`);
      } else {
        console.warn(`[n8n Webhook] Status: ${res.status}`);
      }
    })
    .catch((err) => {
      console.warn('[n8n Webhook Error]:', err.message);
    });
  } catch (err: any) {
    console.warn('[n8n Trigger Error]:', err.message);
  }
};

const extractUserId = async (req: any): Promise<number> => {
  const possibleId = req.user?.id || req.user?.userId || req.userId;
  const parsed = parseInt(possibleId, 10);
  if (!isNaN(parsed)) {
    return parsed;
  }
  try {
    const defaultUser = await pool.query('SELECT id FROM users ORDER BY id ASC LIMIT 1');
    return defaultUser.rows[0]?.id || 1;
  } catch {
    return 1;
  }
};

const formatDateSafe = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') {
    const match = val.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

// Database Schema Self-Healer: Contact Person aur Date Columns ensure karega
const ensureDealsColumns = async () => {
  try {
    await pool.query(`
      ALTER TABLE public.deals 
      ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
      ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS expected_close DATE,
      ADD COLUMN IF NOT EXISTS closing_date DATE,
      ADD COLUMN IF NOT EXISTS due_date DATE,
      ADD COLUMN IF NOT EXISTS document_url TEXT,
      ADD COLUMN IF NOT EXISTS document_name VARCHAR(255);
    `);
  } catch (err: any) {
    // Columns pehle se hain toh continue karega
  }
};

export const getSalesAgents = async (req: any, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role FROM users ORDER BY name ASC'
    );
    res.status(200).json({ success: true, agents: result.rows });
  } catch (error: any) {
    console.error('getSalesAgents error:', error.message);
    res.status(200).json({
      success: true,
      agents: [
        { id: 1, name: 'Admin User', role: 'admin' },
        { id: 2, name: 'Bilal Ahmed', role: 'sales agent' }
      ]
    });
  }
};

export const getDeals = async (req: any, res: Response): Promise<void> => {
  try {
    await ensureDealsColumns();

    const userId = await extractUserId(req);
    const userRole = (req.user?.role || '').toLowerCase();
    
    // Admin aur Manager poori company ki saari deals dekhein ge
    // Sales rep (ya naya user) sirf apni banayi hui deals dekhe ga
    const isExecutive = ['admin', 'manager', 'ceo', 'cfo'].includes(userRole);

    let query = 'SELECT * FROM deals ORDER BY id DESC';
    let params: any[] = [];

    if (!isExecutive) {
      query = 'SELECT * FROM deals WHERE user_id = $1 ORDER BY id DESC';
      params = [userId];
    }

    const result = await pool.query(query, params);

    const formattedDeals = result.rows.map((row: any) => {
      const finalDocUrl = row.document_url || row.documentUrl || '';
      const finalDocName = row.document_name || row.documentName || '';

      let resolvedDocName = finalDocName;
      if (!resolvedDocName && finalDocUrl) {
        resolvedDocName = finalDocUrl.toLowerCase().includes('.pdf') ? 'document.pdf' : 'document.docx';
      }

      const rawDate = row.expected_close || row.closing_date || row.due_date || row.target_date || row.created_at;
      const cleanDate = formatDateSafe(rawDate);
      
      const person = row.contact_person || row.contact_name || row.contactperson || row.contactName || row.client_contact || '';

      return {
        id: row.id,
        title: row.title || 'Untitled Deal',
        company: row.company || 'Direct Client',
        contactPerson: person,
        contact_person: person,
        contactName: person,
        contact_name: person,
        value: Number(row.value) || 0,
        currency: row.currency || 'PKR',
        stage: row.stage || 'Lead In',
        priority: row.priority || 'Medium',
        dueDate: cleanDate,
        expected_close: cleanDate,
        closing_date: cleanDate,
        due_date: cleanDate,
        assignedTo: row.user_id,
        documentUrl: finalDocUrl,
        documentName: resolvedDocName,
        document_url: finalDocUrl,
        document_name: resolvedDocName,
      };
    });

    res.status(200).json({ success: true, deals: formattedDeals });
  } catch (error: any) {
    console.error('getDeals database error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDeal = async (req: any, res: Response): Promise<void> => {
  try {
    await ensureDealsColumns();
    const creatorUserId = await extractUserId(req);
    const {
      title,
      company,
      contactName,
      contact_person,
      contactPerson,
      contact_name,
      value,
      currency,
      stage,
      priority,
      dueDate,
      expected_close,
      closing_date,
      assigned_to,
      assignedTo,
      documentUrl,
      documentName,
      document_url,
      document_name,
    } = req.body;

    const dealTitle = title || 'New Sales Deal';
    const dealCompany = company || 'New Account';
    const dealValue = Number(value) || 0;
    const dealStage = stage || 'Lead In';
    
    let rawTarget = assigned_to || assignedTo;
    let targetUserId = creatorUserId;
    if (rawTarget !== undefined && rawTarget !== null && rawTarget !== '') {
      const parsed = parseInt(rawTarget, 10);
      if (!isNaN(parsed)) {
        targetUserId = parsed;
      }
    }
    
    const inputDate = dueDate || expected_close || closing_date;
    const finalDate = formatDateSafe(inputDate) || formatDateSafe(new Date());
    const person = contactPerson || contact_person || contact_name || contactName || '';

    let docUrl = documentUrl || document_url || null;
    let docName = documentName || document_name || null;

    if (docUrl && !docName) {
      docName = docUrl.toLowerCase().includes('.pdf') ? 'contract.pdf' : 'agreement.docx';
    }

    const query = `
      INSERT INTO public.deals (
        user_id, title, company, value, stage, currency, priority, 
        contact_person, contact_name, expected_close, closing_date, due_date, 
        document_url, document_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const insertValues = [
      targetUserId,
      dealTitle,
      dealCompany,
      dealValue,
      dealStage,
      currency || 'PKR',
      priority || 'Medium',
      person,
      person,
      finalDate || null,
      finalDate || null,
      finalDate || null,
      docUrl,
      docName
    ];

    const result = await pool.query(query, insertValues);
    const saved = result.rows[0];
    const savedDate = formatDateSafe(saved.expected_close || saved.closing_date || saved.due_date || finalDate);
    const savedPerson = saved.contact_person || saved.contact_name || person;

    const currentStage = String(saved.stage || '').toLowerCase();
    if (currentStage.includes('won') || currentStage.includes('closed')) {
      triggerCrmWebhook(saved);
    }

    res.status(201).json({
      success: true,
      deal: {
        id: saved.id,
        title: saved.title,
        company: saved.company,
        contactPerson: savedPerson,
        contact_person: savedPerson,
        contactName: savedPerson,
        contact_name: savedPerson,
        value: Number(saved.value) || 0,
        currency: saved.currency || currency || 'PKR',
        stage: saved.stage,
        priority: saved.priority || priority || 'Medium',
        dueDate: savedDate,
        expected_close: savedDate,
        closing_date: savedDate,
        due_date: savedDate,
        assignedTo: saved.user_id,
        documentUrl: saved.document_url || docUrl || '',
        documentName: saved.document_name || docName || '',
      },
    });
  } catch (error: any) {
    console.error('DEAL CREATE DATABASE ERROR:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDeal = async (req: any, res: Response): Promise<void> => {
  try {
    await ensureDealsColumns();
    const { id } = req.params;
    const dealIdInt = parseInt(id, 10);
    const userId = await extractUserId(req);
    const userRole = (req.user?.role || '').toLowerCase();
    const isExecutive = ['admin', 'manager', 'ceo', 'cfo'].includes(userRole);

    if (!isExecutive) {
      const checkDeal = await pool.query('SELECT user_id FROM deals WHERE id = $1', [dealIdInt]);
      if (checkDeal.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Deal not found' });
        return;
      }
      if (checkDeal.rows[0].user_id !== userId) {
        res.status(403).json({ success: false, message: 'Not authorized to modify this deal' });
        return;
      }
    }

    const {
      title,
      company,
      contactName,
      contact_person,
      contactPerson,
      contact_name,
      value,
      currency,
      stage,
      priority,
      dueDate,
      expected_close,
      closing_date,
      documentUrl,
      documentName,
      document_url,
      document_name,
    } = req.body;

    const personVal = contactPerson !== undefined ? contactPerson : (contact_person !== undefined ? contact_person : (contact_name !== undefined ? contact_name : contactName));
    const inputDate = dueDate || expected_close || closing_date;
    const cleanDateVal = inputDate !== undefined ? formatDateSafe(inputDate) : undefined;

    const updates: string[] = [];
    const values: any[] = [];
    let count = 1;

    if (title !== undefined) { updates.push(`title = $${count++}`); values.push(title); }
    if (company !== undefined) { updates.push(`company = $${count++}`); values.push(company); }
    if (value !== undefined) { updates.push(`value = $${count++}`); values.push(Number(value) || 0); }
    if (stage !== undefined) { updates.push(`stage = $${count++}`); values.push(stage); }
    if (currency !== undefined) { updates.push(`currency = $${count++}`); values.push(currency); }
    if (priority !== undefined) { updates.push(`priority = $${count++}`); values.push(priority); }

    if (personVal !== undefined) {
      updates.push(`contact_person = $${count++}`);
      values.push(personVal);
      updates.push(`contact_name = $${count++}`);
      values.push(personVal);
    }

    if (cleanDateVal !== undefined) {
      updates.push(`expected_close = $${count++}`);
      values.push(cleanDateVal || null);
      updates.push(`closing_date = $${count++}`);
      values.push(cleanDateVal || null);
      updates.push(`due_date = $${count++}`);
      values.push(cleanDateVal || null);
    }

    if (documentUrl !== undefined || document_url !== undefined) {
      updates.push(`document_url = $${count++}`);
      values.push(documentUrl || document_url);
    }
    if (documentName !== undefined || document_name !== undefined) {
      updates.push(`document_name = $${count++}`);
      values.push(documentName || document_name);
    }

    if (updates.length === 0) {
      res.status(200).json({ success: true });
      return;
    }

    values.push(dealIdInt);
    const query = `UPDATE public.deals SET ${updates.join(', ')} WHERE id = $${count} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Deal not found' });
      return;
    }

    const updated = result.rows[0];

    // Auto-complete tasks on Won / Closed AND Trigger n8n Webhook
    const currentStage = String(stage || updated.stage || '').toLowerCase();
    if (currentStage.includes('won') || currentStage.includes('closed')) {
      const dealTitle = updated.title || '';
      await pool.query(
        `UPDATE public.tasks 
         SET status = 'Completed' 
         WHERE (deal_id = $1 OR LOWER(related_deal) = LOWER($2)) 
           AND status != 'Completed'`,
        [dealIdInt, dealTitle]
      );

      // --- AUTOMATED N8N WORKFLOW TRIGGER WITH FULL COMPREHENSIVE PAYLOAD ---
      triggerCrmWebhook(updated);
    }

    const resDocUrl = updated.document_url || documentUrl || document_url || '';
    let resDocName = updated.document_name || documentName || document_name || '';
    if (!resDocName && resDocUrl) {
      resDocName = resDocUrl.toLowerCase().includes('.pdf') ? 'document.pdf' : 'document.docx';
    }

    const finalDate = formatDateSafe(updated.expected_close || updated.closing_date || updated.due_date || inputDate);
    const returnPerson = updated.contact_person || updated.contact_name || personVal || '';

    res.status(200).json({
      success: true,
      deal: {
        id: updated.id,
        title: updated.title,
        company: updated.company,
        contactPerson: returnPerson,
        contact_person: returnPerson,
        contactName: returnPerson,
        contact_name: returnPerson,
        value: Number(updated.value) || 0,
        stage: updated.stage,
        currency: updated.currency || 'PKR',
        priority: updated.priority || 'Medium',
        dueDate: finalDate,
        expected_close: finalDate,
        closing_date: finalDate,
        due_date: finalDate,
        documentUrl: resDocUrl,
        documentName: resDocName,
      }
    });
  } catch (error: any) {
    console.error('DEAL UPDATE ERROR:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDeal = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const dealIdInt = parseInt(id, 10);
    const userId = await extractUserId(req);
    const userRole = (req.user?.role || '').toLowerCase();
    const isExecutive = ['admin', 'manager', 'ceo', 'cfo'].includes(userRole);

    if (!isExecutive) {
      const checkDeal = await pool.query('SELECT user_id FROM deals WHERE id = $1', [dealIdInt]);
      if (checkDeal.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Deal not found' });
        return;
      }
      if (checkDeal.rows[0].user_id !== userId) {
        res.status(403).json({ success: false, message: 'Not authorized to delete this deal' });
        return;
      }
    }

    await pool.query('DELETE FROM deals WHERE id = $1', [dealIdInt]);
    res.status(200).json({ success: true, message: 'Deal deleted successfully' });
  } catch (error: any) {
    console.error('DEAL DELETE ERROR:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};