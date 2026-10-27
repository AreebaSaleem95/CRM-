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

const app = express();

const allowedOrigins = env.CLIENT_URL.split(",").map((s) => s.trim());

app.use(helmet());
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
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/ai", aiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;