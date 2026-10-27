import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { dashboard } from "./dashboard.controller";

const router = Router();

router.get("/", authenticate, dashboard);

export default router;