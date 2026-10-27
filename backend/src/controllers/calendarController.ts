import { Response } from 'express';
import { pool } from '../config/db';

export const getCalendarEvents = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || 1;
    const userRole = req.user?.role || 'CEO';

    let query = '';
    let params: any[] = [];

    if (userRole === 'CEO' || userRole === 'CFO' || userRole === 'Manager') {
      query = `
        SELECT c.*, u.name as created_by_name 
        FROM public.calendar_events c
        LEFT JOIN public.users u ON c.user_id = u.id
        ORDER BY c.event_date ASC, c.id ASC
      `;
    } else {
      query = `
        SELECT c.*, u.name as created_by_name 
        FROM public.calendar_events c
        LEFT JOIN public.users u ON c.user_id = u.id
        WHERE c.user_id = $1
        ORDER BY c.event_date ASC, c.id ASC
      `;
      params = [userId];
    }

    const result = await pool.query(query, params);

    const formatted = result.rows.map((row: any) => {
      const timeStr = row.start_time && row.end_time 
        ? `${row.start_time} - ${row.end_time}`
        : (row.start_time || '10:00 AM - 11:00 AM');

      let color = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      if (row.category === 'Internal Meeting') color = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      if (row.category === 'Presentation') color = 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      if (row.category === 'Closing' || row.category === 'Legal/Closing') color = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      if (row.category === 'Client Call') color = 'bg-sky-500/20 text-sky-300 border-sky-500/40';

      return {
        id: row.id,
        title: row.title,
        date: row.event_date ? new Date(row.event_date).toISOString().split('T')[0] : '',
        time: timeStr,
        type: row.category || 'Client Call',
        color,
        createdByName: row.created_by_name || 'Me'
      };
    });

    res.status(200).json({ success: true, events: formatted });
  } catch (error: any) {
    console.error('getCalendarEvents Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCalendarEvent = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || 1;
    const { title, date, time, type } = req.body;

    const eventDate = date || new Date().toISOString().split('T')[0];
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
        id: saved.id,
        title: saved.title,
        date: saved.event_date ? new Date(saved.event_date).toISOString().split('T')[0] : eventDate,
        time: `${saved.start_time} - ${saved.end_time}`,
        type: saved.category,
        createdByName: req.user?.name || 'Me'
      }
    });
  } catch (error: any) {
    console.error('createCalendarEvent Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reschedule / Move / Update Meeting
export const updateCalendarEvent = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, date, time, type } = req.body;

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
      [title, date, startTime, endTime, type, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Meeting not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Meeting updated successfully', event: result.rows[0] });
  } catch (error: any) {
    console.error('updateCalendarEvent Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel / Delete Meeting
export const deleteCalendarEvent = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM public.calendar_events WHERE id = $1', [id]);
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('deleteCalendarEvent Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};