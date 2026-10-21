import { Response } from 'express';
import { pool } from '../config/db';

// 1. Get all deals of logged-in user (Per-User Isolated View)
export const getDeals = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM deals WHERE user_id = $1 ORDER BY id DESC',
      [userId]
    );

    const formattedDeals = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      company: row.company,
      contactName: row.contact_person || '',
      value: Number(row.value) || 0,
      stage: row.stage || 'Lead In',
      priority: row.priority || 'Medium',
      dueDate: row.closing_date || '',
    }));

    res.status(200).json({ success: true, deals: formattedDeals });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Create new deal
export const createDeal = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { title, company, contactName, contact_person, value, stage, priority, dueDate, closing_date } = req.body;

    const person = contactName || contact_person || '';
    const date = dueDate || closing_date || '';

    const result = await pool.query(
      `INSERT INTO deals (user_id, title, company, contact_person, value, stage, priority, closing_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, title, company, person, value || 0, stage || 'Lead In', priority || 'Medium', date]
    );

    const saved = result.rows[0];
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
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Update deal (Sirf wahi user edit kar sake jiska data hai)
export const updateDeal = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, company, contactName, contact_person, value, stage, priority, dueDate, closing_date } = req.body;

    const person = contactName !== undefined ? contactName : contact_person;
    const date = dueDate !== undefined ? dueDate : closing_date;

    const result = await pool.query(
      `UPDATE deals 
       SET title = COALESCE($1, title),
           company = COALESCE($2, company),
           contact_person = COALESCE($3, contact_person),
           value = COALESCE($4, value),
           stage = COALESCE($5, stage),
           priority = COALESCE($6, priority),
           closing_date = COALESCE($7, closing_date)
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [title, company, person, value, stage, priority, date, id, userId]
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
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM deals WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
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