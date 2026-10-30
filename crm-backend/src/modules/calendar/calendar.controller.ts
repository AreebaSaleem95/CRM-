import { Response } from 'express';
import { pool } from '../../config/db';

const formatDateSafe = (dateVal: any): string => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    return dateVal.split('T')[0];
  }
  const d = new Date(dateVal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getValidUserId = async (req: any): Promise<number> => {
  let parsedId = parseInt(req.user?.id, 10);
  if (!isNaN(parsedId)) return parsedId;
  try {
    const userRes = await pool.query('SELECT id FROM public.users ORDER BY id ASC LIMIT 1');
    if (userRes.rows.length > 0) return userRes.rows[0].id;
  } catch (err) {
    console.warn('Fallback user query failed:', err);
  }
  return 1;
};

export const getCalendarEvents = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = await getValidUserId(req);
    const userRole = (req.user?.role || 'CEO').toUpperCase();

    // 1. Fetch Booked Meetings
    const meetingRes = await pool.query(`
      SELECT c.id, c.title, c.event_date, c.start_time, c.end_time, c.category, u.name as created_by_name
      FROM public.calendar_events c
      LEFT JOIN public.users u ON c.user_id = u.id
      ORDER BY c.event_date ASC
    `);
    const meetings = meetingRes.rows.map(row => ({
      id: `meeting-${row.id}`,
      originalId: row.id,
      title: row.title,
      date: formatDateSafe(row.event_date),
      time: row.start_time && row.end_time ? `${row.start_time} - ${row.end_time}` : (row.start_time || '10:00 AM - 11:00 AM'),
      type: row.category || 'Client Call',
      source: 'meeting',
      createdByName: row.created_by_name || 'Admin User'
    }));

    // 2. Fetch Tasks (Only Pending / Incomplete)
    const taskRes = await pool.query(`
      SELECT t.id, t.title, t.due_date, t.priority, t.category, u.name as assigned_to_name
      FROM public.tasks t
      LEFT JOIN public.users u ON t.user_id = u.id
      WHERE t.due_date IS NOT NULL AND t.status != 'Completed'
    `);
    const taskEvents = taskRes.rows.map(t => ({
      id: `task-${t.id}`,
      originalId: t.id,
      title: t.title,
      date: formatDateSafe(t.due_date),
      time: 'Due All Day',
      type: 'Task',
      source: 'task',
      createdByName: t.assigned_to_name || 'Admin User'
    }));

    // 3. Fetch Deals Closing Dates (EXCLUDING Won / Closed Deals)
    let dealEvents: any[] = [];
    try {
      const dealRes = await pool.query(`
        SELECT d.id, d.title, d.expected_close, d.closing_date, d.stage, u.name as owner_name
        FROM public.deals d
        LEFT JOIN public.users u ON d.user_id = u.id
        WHERE (d.expected_close IS NOT NULL OR d.closing_date IS NOT NULL)
          AND LOWER(COALESCE(d.stage, '')) NOT IN ('won', 'won / closed', 'closed won')
      `);
      
      dealEvents = dealRes.rows.map(d => ({
        id: `deal-${d.id}`,
        originalId: d.id,
        title: `Deal: ${d.title}`,
        date: formatDateSafe(d.expected_close || d.closing_date),
        time: 'Closing Date',
        type: 'Closing',
        source: 'deal',
        stage: d.stage,
        createdByName: d.owner_name || 'Admin User'
      }));
    } catch (e) {
      console.warn('Deals calendar query skipped:', e);
    }

    res.status(200).json({ success: true, events: [...meetings, ...taskEvents, ...dealEvents] });
  } catch (error: any) {
    console.error('getCalendarEvents Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCalendarEvent = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = await getValidUserId(req);
    const { title, date, time, type } = req.body;

    const eventDate = date ? String(date).split('T')[0] : formatDateSafe(new Date());
    const category = type || 'Client Call';
    const timeSlot = time || '11:00 AM - 12:00 PM';

    let startTime = '11:00 AM';
    let endTime = '12:00 PM';
    if (timeSlot.includes('-')) {
      const parts = timeSlot.split('-');
      startTime = parts[0].trim();
      endTime = parts[1].trim();
    } else {
      startTime = timeSlot.trim();
    }

    const result = await pool.query(
      `INSERT INTO public.calendar_events (user_id, title, event_date, start_time, end_time, category, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, title, eventDate, startTime, endTime, category, '']
    );

    const saved = result.rows[0];

    res.status(201).json({
      success: true,
      event: {
        id: `meeting-${saved.id}`,
        originalId: saved.id,
        title: saved.title,
        date: formatDateSafe(saved.event_date),
        time: `${saved.start_time} - ${saved.end_time}`,
        type: saved.category,
        source: 'meeting',
        createdByName: req.user?.name || 'Admin User'
      }
    });
  } catch (error: any) {
    console.error('createCalendarEvent Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reschedule Handler: Updates Tasks table if it is a task, or calendar_events if it is a meeting
export const updateCalendarEvent = async (req: any, res: Response): Promise<void> => {
  try {
    const rawId = String(req.params.id);
    const { title, date, time, type } = req.body;
    const cleanDate = date ? String(date).split('T')[0] : undefined;

    if (rawId.startsWith('task-')) {
      const taskId = parseInt(rawId.replace('task-', ''), 10);
      await pool.query(
        `UPDATE public.tasks 
         SET due_date = COALESCE($1, due_date)
         WHERE id = $2`,
        [cleanDate, taskId]
      );
      res.status(200).json({ success: true, message: 'Task rescheduled successfully' });
      return;
    }

    const meetingId = parseInt(rawId.replace('meeting-', '').replace('deal-', ''), 10);

    let startTime = '11:00 AM';
    let endTime = '12:00 PM';
    if (time && time.includes('-')) {
      const parts = time.split('-');
      startTime = parts[0].trim();
      endTime = parts[1].trim();
    } else if (time) {
      startTime = time.trim();
    }

    const result = await pool.query(
      `UPDATE public.calendar_events 
       SET title = COALESCE($1, title),
           event_date = COALESCE($2, event_date),
           start_time = COALESCE($3, start_time),
           end_time = COALESCE($4, end_time),
           category = COALESCE($5, category)
       WHERE id = $6
       RETURNING *`,
      [title, cleanDate, startTime, endTime, type, meetingId]
    );

    res.status(200).json({ success: true, message: 'Meeting updated successfully', event: result.rows[0] });
  } catch (error: any) {
    console.error('updateCalendarEvent Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Handler: Handles Tasks or Meetings accordingly
export const deleteCalendarEvent = async (req: any, res: Response): Promise<void> => {
  try {
    const rawId = String(req.params.id);

    if (rawId.startsWith('task-')) {
      const taskId = parseInt(rawId.replace('task-', ''), 10);
      await pool.query('DELETE FROM public.tasks WHERE id = $1', [taskId]);
      res.status(200).json({ success: true, message: 'Task deleted successfully' });
      return;
    }

    const meetingId = parseInt(rawId.replace('meeting-', ''), 10);
    await pool.query('DELETE FROM public.calendar_events WHERE id = $1', [meetingId]);
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('deleteCalendarEvent Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};