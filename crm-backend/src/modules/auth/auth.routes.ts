import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { loginSchema, logoutSchema, refreshSchema } from "./auth.schema";
import * as controller from "./auth.controller";

const router = Router();

router.post("/login", validate(loginSchema), controller.login);
router.post("/refresh", validate(refreshSchema), controller.refresh);
router.post("/logout", validate(logoutSchema), controller.logout);
router.get("/me", authenticate, controller.me);

export default router;