import { Response } from 'express';
import { pool } from '../config/db';

// 1. Fetch user notifications from DB
export const getUserNotifications = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const result = await pool.query(
      `SELECT id, channel, title, description, link, is_read, created_at 
       FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );

    res.status(200).json({ success: true, notifications: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Mark single or all notifications as read in DB
export const markNotificationsRead = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { notificationId } = req.body;

    if (notificationId) {
      await pool.query(
        'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
      );
    } else {
      await pool.query(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
        [userId]
      );
    }

    res.status(200).json({ success: true, message: 'Marked as read in database' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get User Settings / Preferences from DB
export const getUserSettings = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    let result = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [userId]);

    if (result.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *`,
        [userId]
      );
    }

    res.status(200).json({ success: true, settings: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update User Settings in DB
export const updateUserSettings = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { new_deal_alert, task_due_alert, whatsapp_alert, default_currency, pipeline_layout } = req.body;

    const result = await pool.query(
      `INSERT INTO user_settings (user_id, new_deal_alert, task_due_alert, whatsapp_alert, default_currency, pipeline_layout, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         new_deal_alert = COALESCE($2, user_settings.new_deal_alert),
         task_due_alert = COALESCE($3, user_settings.task_due_alert),
         whatsapp_alert = COALESCE($4, user_settings.whatsapp_alert),
         default_currency = COALESCE($5, user_settings.default_currency),
         pipeline_layout = COALESCE($6, user_settings.pipeline_layout),
         updated_at = NOW()
       RETURNING *`,
      [userId, new_deal_alert, task_due_alert, whatsapp_alert, default_currency, pipeline_layout]
    );

    res.status(200).json({ success: true, settings: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};