import { Response } from 'express';
import { pool } from '../../config/db';

const triggerCrmWebhook = async (...args: any[]) => {};

/**
 * Safe Date Formatter to avoid Timezone offset shifting (e.g. 31 turning into 30)
 */
const formatDateSafe = (dateVal: any): string => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    return dateVal.split('T')[0];
  }
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

const getValidUserId = async (req: any): Promise<number> => {
  let parsedId = parseInt(req.user?.id || req.user?.userId || req.userId, 10);
  if (!isNaN(parsedId)) {
    return parsedId;
  }
  try {
    const userRes = await pool.query('SELECT id FROM public.users ORDER BY id ASC LIMIT 1');
    if (userRes.rows.length > 0) {
      return userRes.rows[0].id;
    }
  } catch (err) {
    console.warn('Fallback user query failed:', err);
  }
  return 1;
};

export const getTasks = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = await getValidUserId(req);
    const userRole = (req.user?.role || '').toLowerCase();
    const isExecutive = ['admin', 'manager', 'ceo', 'cfo'].includes(userRole);

    let query = '';
    let params: any[] = [];

    if (isExecutive) {
      query = `
        SELECT t.*, u.name as assigned_to_name, d.title as linked_deal_title
        FROM public.tasks t
        LEFT JOIN public.users u ON t.user_id = u.id
        LEFT JOIN public.deals d ON t.deal_id = d.id
        ORDER BY t.id DESC
      `;
    } else {
      query = `
        SELECT t.*, u.name as assigned_to_name, d.title as linked_deal_title
        FROM public.tasks t
        LEFT JOIN public.users u ON t.user_id = u.id
        LEFT JOIN public.deals d ON t.deal_id = d.id
        WHERE t.user_id = $1
        ORDER BY t.id DESC
      `;
      params = [userId];
    }

    const result = await pool.query(query, params);

    const formattedTasks = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      dealId: row.deal_id || null,
      relatedDeal: row.linked_deal_title || row.related_deal || '',
      dueDate: formatDateSafe(row.due_date),
      priority: row.priority || 'Medium',
      category: row.category || 'Follow-up',
      completed: row.status === 'Completed',
      assignedTo: row.assigned_to_name || req.user?.name || 'Admin User'
    }));

    res.status(200).json({ success: true, tasks: formattedTasks });
  } catch (error: any) {
    console.error('getTasks error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTask = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = await getValidUserId(req);
    const { title, dealId, relatedDeal, dueDate, priority, category } = req.body;
    const formattedDate = dueDate ? String(dueDate).split('T')[0] : formatDateSafe(new Date());
    const assignedName = req.user?.name || 'Admin User';
    const parsedDealId = dealId ? parseInt(dealId, 10) : null;

    const result = await pool.query(
      `INSERT INTO public.tasks (user_id, deal_id, title, related_deal, due_date, priority, category, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending')
       RETURNING *`,
      [userId, parsedDealId, title, relatedDeal || '', formattedDate, priority || 'Medium', category || 'Follow-up']
    );

    const saved = result.rows[0];

    let finalDealTitle = relatedDeal || '';
    if (parsedDealId) {
      const dealRes = await pool.query('SELECT title FROM public.deals WHERE id = $1', [parsedDealId]);
      if (dealRes.rows.length > 0) {
        finalDealTitle = dealRes.rows[0].title;
      }
    }

    res.status(201).json({
      success: true,
      task: {
        id: saved.id,
        title: saved.title,
        dealId: saved.deal_id,
        relatedDeal: finalDealTitle,
        dueDate: formatDateSafe(saved.due_date),
        priority: saved.priority,
        category: saved.category,
        completed: false,
        assignedTo: assignedName
      }
    });
  } catch (error: any) {
    console.error('createTask error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTask = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const taskIdInt = parseInt(id, 10);
    const userId = await getValidUserId(req);
    const userRole = (req.user?.role || '').toLowerCase();
    const isExecutive = ['admin', 'manager', 'ceo', 'cfo'].includes(userRole);

    // Security Check: Sales user kisi doosre ka task edit na kar sake
    if (!isExecutive) {
      const checkTask = await pool.query('SELECT user_id FROM public.tasks WHERE id = $1', [taskIdInt]);
      if (checkTask.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
      }
      if (checkTask.rows[0].user_id !== userId) {
        res.status(403).json({ success: false, message: 'Not authorized to modify this task' });
        return;
      }
    }

    const { title, dealId, relatedDeal, dueDate, priority, category } = req.body;
    const parsedDealId = dealId ? parseInt(dealId, 10) : null;
    const cleanDate = dueDate ? String(dueDate).split('T')[0] : undefined;

    const result = await pool.query(
      `UPDATE public.tasks 
       SET title = COALESCE($1, title),
           deal_id = COALESCE($2, deal_id),
           related_deal = COALESCE($3, related_deal),
           due_date = COALESCE($4, due_date),
           priority = COALESCE($5, priority),
           category = COALESCE($6, category)
       WHERE id = $7
       RETURNING *`,
      [title, parsedDealId, relatedDeal, cleanDate, priority, category, taskIdInt]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const saved = result.rows[0];
    const userRes = await pool.query('SELECT name FROM public.users WHERE id = $1', [saved.user_id]);
    const assignedName = userRes.rows[0]?.name || req.user?.name || 'Admin User';

    let finalDealTitle = saved.related_deal || '';
    if (saved.deal_id) {
      const dealRes = await pool.query('SELECT title FROM public.deals WHERE id = $1', [saved.deal_id]);
      if (dealRes.rows.length > 0) finalDealTitle = dealRes.rows[0].title;
    }

    res.status(200).json({
      success: true,
      task: {
        id: saved.id,
        title: saved.title,
        dealId: saved.deal_id,
        relatedDeal: finalDealTitle,
        dueDate: formatDateSafe(saved.due_date),
        priority: saved.priority,
        category: saved.category,
        completed: saved.status === 'Completed',
        assignedTo: assignedName
      }
    });
  } catch (error: any) {
    console.error('updateTask error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleTaskStatus = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const taskIdInt = parseInt(id, 10);
    const userId = await getValidUserId(req);
    const userRole = (req.user?.role || '').toLowerCase();
    const isExecutive = ['admin', 'manager', 'ceo', 'cfo'].includes(userRole);

    // Security Check: Sales user kisi doosre ka task status toggle na kar sake
    if (!isExecutive) {
      const checkTask = await pool.query('SELECT user_id FROM public.tasks WHERE id = $1', [taskIdInt]);
      if (checkTask.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
      }
      if (checkTask.rows[0].user_id !== userId) {
        res.status(403).json({ success: false, message: 'Not authorized to toggle this task' });
        return;
      }
    }

    const { completed } = req.body;
    const newStatus = completed ? 'Completed' : 'Pending';

    const result = await pool.query(
      `UPDATE public.tasks SET status = $1 WHERE id = $2 RETURNING *`,
      [newStatus, taskIdInt]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.status(200).json({ success: true, task: result.rows[0] });
  } catch (error: any) {
    console.error('toggleTaskStatus error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTask = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const taskIdInt = parseInt(id, 10);
    const userId = await getValidUserId(req);
    const userRole = (req.user?.role || '').toLowerCase();
    const isExecutive = ['admin', 'manager', 'ceo', 'cfo'].includes(userRole);

    // Security Check: Sales user kisi doosre ka task delete na kar sake
    if (!isExecutive) {
      const checkTask = await pool.query('SELECT user_id FROM public.tasks WHERE id = $1', [taskIdInt]);
      if (checkTask.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Task not found' });
        return;
      }
      if (checkTask.rows[0].user_id !== userId) {
        res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
        return;
      }
    }

    await pool.query('DELETE FROM public.tasks WHERE id = $1', [taskIdInt]);
    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('deleteTask error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};