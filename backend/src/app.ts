import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import dealRoutes from './routes/dealRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/deals', dealRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Backend & DB running fine' });
});

app.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
});