import { UploadApiResponse } from "cloudinary";
import cloudinary, { isCloudinaryConfigured } from "../../config/cloudinary";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";

function uploadBuffer(buffer: Buffer): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "crm/avatars",
        resource_type: "image",
        // Cloudinary par 400x400 ki square photo save hoti hai (storage bachane ke liye)
        transformation: [{ width: 400, height: 400, crop: "fill", gravity: "auto" }],
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!isCloudinaryConfigured) {
    throw new ApiError(503, "Image upload is not configured on the server");
  }
  if (!req.file) {
    throw new ApiError(400, "No file uploaded (the field name must be 'file')");
  }

  try {
    const result = await uploadBuffer(req.file.buffer);
    res.status(201).json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error("[cloudinary] upload failed:", err);
    throw new ApiError(502, "Image upload failed. Please check the Cloudinary settings.");
  }
});