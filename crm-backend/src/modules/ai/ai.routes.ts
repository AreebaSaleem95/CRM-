import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { rateLimitPerUser } from "../../middleware/rateLimit";
import { validate } from "../../middleware/validate";
import { followUpSchema } from "./ai.schema";
import * as controller from "./ai.controller";

const router = Router();

router.use(authenticate);

// Har user ke liye 1 minute mein 5 requests
router.post(
  "/leads/:id/follow-up",
  rateLimitPerUser(5, 60 * 1000),
  validate(followUpSchema),
  controller.followUp
);

export default router;