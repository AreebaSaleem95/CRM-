import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/crm_db?schema=public',
});

pool.on('connect', () => {
  console.log('PostgreSQL database (crm_db) connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});