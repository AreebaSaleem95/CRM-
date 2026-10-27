import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    if (!fullName || !email || !password || !confirmPassword) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ success: false, message: 'Passwords do not match' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      return;
    }

    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userExists.rows.length > 0) {
      res.status(400).json({ success: false, message: 'Email already registered' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [fullName.trim(), email.toLowerCase().trim(), hashedPassword, 'Sales Agent']
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please login.',
      user: newUser.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      res.status(400).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'supersecretcrmtokenkey123',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company || '',
        avatar: user.avatar || ''
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { name, role, company, avatar } = req.body;

    const updatedUser = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           role = COALESCE($2, role), 
           company = COALESCE($3, company), 
           avatar = COALESCE($4, avatar) 
       WHERE id = $5 
       RETURNING id, name, email, role, company, avatar`,
      [name, role, company, avatar, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully in database',
      user: updatedUser.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current and new password are required' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
      return;
    }

    // 1. Fetch current password hash from DB
    const userResult = await pool.query('SELECT * FROM public.users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const user = userResult.rows[0];

    // 2. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    // 3. Hash new password & update
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE public.users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

    res.status(200).json({ success: true, message: 'Password updated successfully in database!' });
  } catch (error: any) {
    console.error('changePassword error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};