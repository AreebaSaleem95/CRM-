import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { dashboard, search, notifications } from "./dashboard.controller";

const router = Router();

// 1. Existing Dashboard Route (Preserved)
router.get("/", authenticate, dashboard);

// 2. Global Search Route (Leads, Contacts, Deals, Tasks)
router.get("/search", authenticate, search);

// 3. Notification Bell Route (Pending Tasks & Recent Alerts)
router.get("/notifications", authenticate, notifications);

export default router;