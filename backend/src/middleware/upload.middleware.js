import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/ApiError.js';

// Ensure upload directories exist
const profilesDir = path.join(process.cwd(), 'uploads', 'profiles');
const verificationsDir = path.join(process.cwd(), 'uploads', 'verifications');

if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}
if (!fs.existsSync(verificationsDir)) {
  fs.mkdirSync(verificationsDir, { recursive: true });
}

// Storage for profile photos
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `profile-${req.user._id}-${uniqueSuffix}${ext}`);
  },
});

// Storage for verification selfies/docs
const verificationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, verificationsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `verification-${req.user._id}-${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Strict file filter to check MIME types and reject dangerous formats (e.g., SVG, HTML, scripts)
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new ApiError(400, 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
  
  if (['.svg', '.html', '.htm', '.js', '.php', '.exe', '.sh'].includes(ext)) {
    return cb(new ApiError(400, 'File type not permitted for security reasons.'), false);
  }

  cb(null, true);
};

export function validateImageMagicBytes(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebp =
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50;

    return isJpeg || isPng || isWebp;
  } catch (err) {
    return false;
  }
}

const multerProfileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFileFilter,
}).single('photo');

const multerVerificationUpload = multer({
  storage: verificationStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter: imageFileFilter,
}).fields([
  { name: 'selfie', maxCount: 1 },
  { name: 'document', maxCount: 1 },
]);

export const uploadProfilePhoto = (req, res, next) => {
  multerProfileUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'Image exceeds maximum allowed size of 5MB.'));
      }
      return next(err);
    }
    if (req.file) {
      const isValidSignature = validateImageMagicBytes(req.file.path);
      if (!isValidSignature) {
        fs.unlink(req.file.path, () => {});
        return next(new ApiError(400, 'Corrupted or invalid image file signature. Permitted types: JPEG, PNG, WebP.'));
      }
    }
    next();
  });
};

export const uploadVerificationFiles = (req, res, next) => {
  multerVerificationUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'Verification file exceeds maximum allowed size of 5MB.'));
      }
      return next(err);
    }
    if (req.files) {
      for (const field of ['selfie', 'document']) {
        const file = req.files[field]?.[0];
        if (file) {
          const isValidSignature = validateImageMagicBytes(file.path);
          if (!isValidSignature) {
            fs.unlink(file.path, () => {});
            return next(new ApiError(400, `Corrupted or invalid file signature for ${field}. Permitted types: JPEG, PNG, WebP.`));
          }
        }
      }
    }
    next();
  });
};

