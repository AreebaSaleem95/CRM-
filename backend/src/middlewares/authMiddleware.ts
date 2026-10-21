import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Access denied. Token missing.' });
    return;
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'supersecretcrmtokenkey123');
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
};