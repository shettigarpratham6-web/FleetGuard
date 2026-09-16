const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Base uploads directory
const uploadsBase = path.join(__dirname, '../../uploads');

// Category-based subdirectories
const categories = ['insurance', 'inspection', 'emissions', 'service'];

// Ensure all upload subdirectories exist
categories.forEach((category) => {
  const dir = path.join(uploadsBase, category);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Determine the upload subdirectory based on the document type or route.
 */
const getUploadPath = (req) => {
  const docType = (req.body.document_type || '').toLowerCase();

  if (docType.includes('insurance')) return path.join(uploadsBase, 'insurance');
  if (docType.includes('inspection')) return path.join(uploadsBase, 'inspection');
  if (docType.includes('puc') || docType.includes('emission')) return path.join(uploadsBase, 'emissions');

  // Default to service for service record invoices and uncategorized uploads
  return path.join(uploadsBase, 'service');
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = getUploadPath(req);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images (JPG, JPEG, PNG), and DOC/DOCX are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

module.exports = upload;
