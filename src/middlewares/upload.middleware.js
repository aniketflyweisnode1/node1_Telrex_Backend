const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Middleware for multiple image uploads
exports.uploadMultipleImages = upload.array('images', 10); // Max 10 images

// Middleware for single image upload
exports.uploadSingleImage = upload.single('image');

// Middleware for profile picture upload
exports.uploadProfilePicture = upload.single('profilePicture');

// Middleware for medical license document upload (PDF or image)
const licenseFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) or PDF files are allowed'));
  }
};

const licenseUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for documents
  },
  fileFilter: licenseFileFilter
});

exports.uploadMedicalLicense = licenseUpload.single('medicalLicense');

// Middleware for multiple file uploads (profile picture + license)
exports.uploadDoctorFiles = upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'medicalLicense', maxCount: 1 }
]);

// Helper to get file URL
exports.getFileUrl = (req, filename) => {
  if (!filename) return null;
  const baseUrl = req.protocol + '://' + req.get('host');
  return `${baseUrl}/uploads/${filename}`;
};

