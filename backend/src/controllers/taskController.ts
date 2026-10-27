import { Response } from 'express';
import { pool } from '../config/db';

export const getTasks = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = '';
    let params: any[] = [];

    if (userRole === 'CEO' || userRole === 'CFO' || userRole === 'Manager') {
      query = `
        SELECT t.*, u.name as assigned_to_name 
        FROM tasks t
        LEFT JOIN users u ON t.user_id = u.id
        ORDER BY t.id DESC
      `;
    } else {
      query = `
        SELECT t.*, u.name as assigned_to_name 
        FROM tasks t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.user_id = $1
        ORDER BY t.id DESC
      `;
      params = [userId];
    }

    const result = await pool.query(query, params);

    const formattedTasks = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      relatedDeal: row.related_deal || '',
      dueDate: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : '',
      priority: row.priority || 'Medium',
      category: row.category || 'Follow-up',
      completed: row.status === 'Completed',
      assignedTo: row.assigned_to_name || 'Me'
    }));

    res.status(200).json({ success: true, tasks: formattedTasks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTask = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { title, relatedDeal, dueDate, priority, category } = req.body;
    const formattedDate = dueDate || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, related_deal, due_date, priority, category, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
       RETURNING *`,
      [userId, title, relatedDeal || '', formattedDate, priority || 'Medium', category || 'Follow-up']
    );

    const saved = result.rows[0];

    res.status(201).json({
      success: true,
      task: {
        id: saved.id,
        title: saved.title,
        relatedDeal: saved.related_deal || '',
        dueDate: saved.due_date ? new Date(saved.due_date).toISOString().split('T')[0] : '',
        priority: saved.priority,
        category: saved.category,
        completed: false,
        assignedTo: req.user.name || 'Me'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTask = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, relatedDeal, dueDate, priority, category } = req.body;

    const result = await pool.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           related_deal = COALESCE($2, related_deal),
           due_date = COALESCE($3, due_date),
           priority = COALESCE($4, priority),
           category = COALESCE($5, category)
       WHERE id = $6
       RETURNING *`,
      [title, relatedDeal, dueDate, priority, category, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const saved = result.rows[0];
    res.status(200).json({
      success: true,
      task: {
        id: saved.id,
        title: saved.title,
        relatedDeal: saved.related_deal || '',
        dueDate: saved.due_date ? new Date(saved.due_date).toISOString().split('T')[0] : '',
        priority: saved.priority,
        category: saved.category,
        completed: saved.status === 'Completed'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleTaskStatus = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { completed } = req.body;
    const newStatus = completed ? 'Completed' : 'Pending';

    const result = await pool.query(
      `UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *`,
      [newStatus, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.status(200).json({ success: true, task: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTask = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};