import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { config } from '../../config/envValidation';

const AVATARS_DIR = path.join(config.uploadDir, 'avatars');

export async function uploadAvatar(userId: number, file: Express.Multer.File): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });
  if (!user) throw new AppError(404, 'User not found.');

  // Resize and convert to WebP
  const outputName = `${crypto.randomBytes(16).toString('hex')}.webp`;
  const outputPath = path.join(AVATARS_DIR, outputName);

  await sharp(file.path)
    .resize(200, 200, { fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(outputPath);

  // Remove the original upload (multer saved the raw file)
  fs.unlink(file.path, () => {});

  // Remove old avatar if exists
  if (user.avatarUrl) {
    const oldPath = path.join(config.uploadDir, '..', '..', 'public', user.avatarUrl.replace(/^\/uploads\//, 'uploads/'));
    fs.unlink(oldPath, () => {});
  }

  const avatarUrl = `/uploads/avatars/${outputName}`;
  await prisma.user.update({ where: { id: userId }, data: { avatarUrl } });

  return avatarUrl;
}

export async function removeAvatar(userId: number): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });
  if (!user) throw new AppError(404, 'User not found.');

  if (user.avatarUrl) {
    const filePath = path.join(config.uploadDir, user.avatarUrl.replace('/uploads/', ''));
    fs.unlink(filePath, () => {});
  }

  await prisma.user.update({ where: { id: userId }, data: { avatarUrl: null } });
}
