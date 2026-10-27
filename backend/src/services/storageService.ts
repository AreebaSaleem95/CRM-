import { v2 as cloudinary } from 'cloudinary';
import path from 'path';

cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
});

export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string = 'crm_documents',
  originalFilename?: string
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    
    const ext = originalFilename ? path.extname(originalFilename) : '';
    const baseName = originalFilename
      ? path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '_')
      : `doc_${Date.now()}`;


    const publicIdWithExt = `${baseName}_${Date.now()}${ext}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'raw', 
        public_id: publicIdWithExt,
        use_filename: true,
        unique_filename: false,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Raw Upload Error:', error);
          return reject(error);
        }
        if (!result) {
          return reject(new Error('Cloudinary upload returned empty result'));
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;