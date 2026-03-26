import multer from 'multer';
import { RequestHandler } from 'express';
import path from 'path';
import crypto from 'crypto';
import { AppError } from './errorHandler';
import { config } from '../config/envValidation';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = crypto.randomBytes(16).toString('hex');
    cb(null, `${unique}${ext}`);
  },
});

export const uploadImage: RequestHandler = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  },
}).single('image');

// Avatar upload — smaller limit, separate directory
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_MAX = 2 * 1024 * 1024; // 2MB

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(config.uploadDir, 'avatars'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = crypto.randomBytes(16).toString('hex');
    cb(null, `${unique}${ext}`);
  },
});

export const uploadAvatar: RequestHandler = multer({
  storage: avatarStorage,
  limits: { fileSize: AVATAR_MAX },
  fileFilter: (_req, file, cb) => {
    if (AVATAR_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only JPEG, PNG, and WebP images are allowed for avatars.'));
    }
  },
}).single('avatar');
