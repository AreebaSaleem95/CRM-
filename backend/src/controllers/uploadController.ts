import { Request, Response } from 'express';
import multer from 'multer';
import { uploadToCloudinary } from '../services/storageService';

// Configure multer memory storage to keep uploaded files in memory buffers
const storage = multer.memoryStorage();

// Multer middleware setup with 10MB maximum file size limit
export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).single('file');

/**
 * Handle document and file uploads to Cloudinary storage.
 * Extracts original file name and buffer to preserve document extensions (.pdf, .docx, .doc).
 */
export const handleFileUpload = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Validate if file was received in the multipart payload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided for upload',
      });
    }

    // Stream upload buffer to Cloudinary with original file name and extension
    const uploaded = await uploadToCloudinary(
      req.file.buffer,
      'crm_documents',
      req.file.originalname
    );

    // Return uploaded document metadata and secure delivery URL
    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        url: uploaded.secure_url,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
      },
    });
  } catch (error: any) {
    console.error('Cloudinary Upload Execution Error:', error);
    return res.status(500).json({
      success: false,
      message: 'File upload to storage failed',
      error: error?.message || 'Internal Cloudinary Error',
    });
  }
};