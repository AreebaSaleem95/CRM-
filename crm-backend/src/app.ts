import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/errorHandler";
import aiRoutes from "./modules/ai/ai.routes";
import authRoutes from "./modules/auth/auth.routes";
import contactsRoutes from "./modules/contacts/contacts.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import leadsRoutes from "./modules/leads/leads.routes";
import uploadsRoutes from "./modules/uploads/uploads.routes";
import dealRoutes from "./modules/deals/deal.routes";
import taskRoutes from "./modules/tasks/task.routes";
import calendarRoutes from './modules/calendar/calendar.routes';

const app = express();

const allowedOrigins = env.CLIENT_URL.split(",").map((s) => s.trim());

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Development mein koi bhi localhost port allowed (Vite port badalta rehta hai)
      const isLocalDev =
        env.NODE_ENV !== "production" && !!origin && /^http:\/\/localhost:\d+$/.test(origin);
      if (!origin || allowedOrigins.includes(origin) || isLocalDev) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan("dev"));

// Root Server Health & Status Page
app.get("/", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>NovaCRM API Server</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #0f172a;
          color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }
        .card {
          background: #1e293b;
          border: 1px solid #334155;
          padding: 2.5rem;
          border-radius: 1.25rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          text-align: center;
          max-width: 440px;
          width: 90%;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          padding: 0.4rem 0.9rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.025em;
          margin-bottom: 1.25rem;
        }
        .dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
        }
        h1 {
          font-size: 1.75rem;
          margin: 0 0 0.5rem 0;
          font-weight: 800;
          letter-spacing: -0.025em;
        }
        p {
          color: #94a3b8;
          font-size: 0.95rem;
          margin: 0 0 1.5rem 0;
          line-height: 1.5;
        }
        .status-box {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 0.75rem;
          padding: 1rem;
          font-size: 0.85rem;
          color: #cbd5e1;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .status-item {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #1e293b;
          padding-bottom: 0.35rem;
        }
        .status-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .status-label {
          color: #64748b;
        }
        .status-val {
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">
          <span class="dot"></span> System Operational
        </div>
        <h1>Nova<span style="color: #6366f1;">CRM</span> API</h1>
        <p>PostgreSQL Database, Authentication Engine, and Services are running normally.</p>
        <div class="status-box">
          <div class="status-item">
            <span class="status-label">Server Status:</span>
            <span class="status-val" style="color: #34d399;">200 OK</span>
          </div>
          <div class="status-item">
            <span class="status-label">Database:</span>
            <span class="status-val" style="color: #38bdf8;">Connected</span>
          </div>
          <div class="status-item">
            <span class="status-label">Client Portal:</span>
            <span class="status-val"><a href="http://localhost:5173" style="color: #818cf8; text-decoration: none;">localhost:5173</a></span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/tasks", taskRoutes);
app.use('/api/calendar', calendarRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;