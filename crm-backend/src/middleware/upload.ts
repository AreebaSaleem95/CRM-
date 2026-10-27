import multer from "multer";
import { ApiError } from "../utils/ApiError";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB

// File disk par nahi, RAM (req.file.buffer) mein aati hai, aur wahan se seedha Cloudinary jati hai
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, "Only JPG, PNG or WEBP images are allowed"));
  },
});