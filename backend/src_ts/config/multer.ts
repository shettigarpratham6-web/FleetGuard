import multer from 'multer';
import path from 'path';
import fs from 'fs';
import type { Request } from 'express';

const uploadsBase = path.join(__dirname, '../../uploads');

const categories = ['insurance', 'inspection', 'emissions', 'service'];

categories.forEach((category) => {
  const dir = path.join(uploadsBase, category);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const getUploadPath = (req: Request): string => {
  const docType = (req.body?.document_type || '').toLowerCase();

  if (docType.includes('insurance')) return path.join(uploadsBase, 'insurance');
  if (docType.includes('inspection')) return path.join(uploadsBase, 'inspection');
  if (docType.includes('puc') || docType.includes('emission')) return path.join(uploadsBase, 'emissions');

  return path.join(uploadsBase, 'service');
};

const storage = multer.diskStorage({
  destination: (req: Request, file: any, cb: (error: Error | null, destination: string) => void) => {
    const uploadPath = getUploadPath(req);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req: Request, file: any, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: Request, file: any, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images (JPG, JPEG, PNG), and DOC/DOCX are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export default upload;
