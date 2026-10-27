import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { uploadImage } from "../../middleware/upload";
import * as controller from "./uploads.controller";

const router = Router();

router.post("/avatar", authenticate, uploadImage.single("file"), controller.uploadAvatar);

export default router;