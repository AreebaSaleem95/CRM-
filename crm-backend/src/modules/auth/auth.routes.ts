import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { loginSchema, logoutSchema, refreshSchema } from "./auth.schema";
import * as controller from "./auth.controller";
import { pool } from "../../config/db";

const router = Router();

router.post("/login", validate(loginSchema), controller.login);
router.post("/refresh", validate(refreshSchema), controller.refresh);
router.post("/logout", validate(logoutSchema), controller.logout);
router.get("/me", authenticate, controller.me);

// Profile Update & Password Change Routes
router.put("/profile", authenticate, controller.updateProfile);
router.put("/change-password", authenticate, controller.changePassword);
router.post("/register", controller.register);
router.post("/reset-password", controller.resetPassword);

// --- TEAM MANAGEMENT ROUTES (ADMIN ONLY) ---

// 1. Get all registered team members
router.get("/users", authenticate, async (req: any, res: any) => {
  try {
    const userRole = (req.user?.role || "").toLowerCase();
    if (userRole !== "admin") {
      return res.status(403).json({ success: false, message: "Sirf Admin ko authority dekhne ki ijazat hai." });
    }

    const result = await pool.query(
      "SELECT id, name, email, role, created_at FROM public.users ORDER BY id DESC"
    );

    res.status(200).json({ success: true, users: result.rows });
  } catch (err: any) {
    console.error("GET USERS ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Update user role (Promote to Manager / Admin / Sales)
router.patch("/users/:id/role", authenticate, async (req: any, res: any) => {
  try {
    const userRole = (req.user?.role || "").toLowerCase();
    if (userRole !== "admin") {
      return res.status(403).json({ success: false, message: "Sirf Admin kisi user ka role badal sakta hai." });
    }

    const targetUserId = parseInt(req.params.id, 10);
    const { role } = req.body;

    const allowed = ["sales", "manager", "admin"];
    const targetRole = String(role || "").toLowerCase();

    if (!allowed.includes(targetRole)) {
      return res.status(400).json({ success: false, message: "Invalid role selected." });
    }

    const updated = await pool.query(
      "UPDATE public.users SET role = $1 WHERE id = $2 RETURNING id, name, email, role",
      [targetRole, targetUserId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User nahi mila." });
    }

    res.status(200).json({
      success: true,
      message: `User ka role successfully ${targetRole.toUpperCase()} kar diya gaya hai!`,
      user: updated.rows[0],
    });
  } catch (err: any) {
    console.error("UPDATE ROLE ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;