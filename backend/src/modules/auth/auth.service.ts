import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { jwtConfig } from '../../config/jwt';
import { AppError } from '../../middleware/errorHandler';
import { AuthUser } from '../../middleware/authenticate';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function signAccessToken(user: AuthUser): string {
  return jwt.sign(user, jwtConfig.accessSecret, { expiresIn: jwtConfig.accessExpiry as jwt.SignOptions['expiresIn'] });
}

function signRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export async function register(email: string, username: string, password: string) {
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) throw new AppError(409, 'An account with that email already exists.');

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) throw new AppError(409, 'That username is already taken.');

  const userRole = await prisma.role.findUnique({ where: { name: 'user' } });
  if (!userRole) throw new AppError(500, 'Default role not found. Please run database seed.');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, username, passwordHash, roleId: userRole.id },
    include: { role: true },
  });

  return buildTokenPair(user);
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user || !user.isActive) throw new AppError(401, 'Invalid email or password.');

  // Check account lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError(429, 'Account temporarily locked due to too many failed attempts. Try again later.');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    const data: { failedLoginAttempts: number; lockedUntil?: Date } = { failedLoginAttempts: attempts };
    if (attempts >= 5) {
      data.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
    await prisma.user.update({ where: { id: user.id }, data });
    throw new AppError(401, 'Invalid email or password.');
  }

  // Reset failed attempts on successful login
  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  return buildTokenPair(user);
}

async function buildTokenPair(user: { id: number; email: string; username: string; role: { name: string }; tokenVersion?: number }) {
  const tokenVersion = user.tokenVersion ?? 0;
  const payload: AuthUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role.name,
    tokenVersion,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken();
  const tokenHash = hashToken(refreshToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  return { accessToken, refreshToken, user: payload };
}

export async function refresh(token: string) {
  const tokenHash = hashToken(token);
  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash },
    include: { user: { include: { role: true } } },
  });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw new AppError(401, 'Invalid or expired refresh token.');
  }

  if (!stored.user.isActive) throw new AppError(401, 'Account is deactivated.');

  const payload: AuthUser = {
    id: stored.user.id,
    email: stored.user.email,
    username: stored.user.username,
    role: stored.user.role.name,
    tokenVersion: stored.user.tokenVersion,
  };

  const accessToken = signAccessToken(payload);
  return { accessToken, user: payload };
}

export async function logout(token: string) {
  const tokenHash = hashToken(token);
  await prisma.refreshToken.deleteMany({ where: { tokenHash } });
}

export async function changePassword(userId: number, oldPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found.');

  const valid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!valid) throw new AppError(401, 'Current password is incorrect.');

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });

  // Revoke all refresh tokens so user must log in again
  await prisma.refreshToken.deleteMany({ where: { userId } });

  return { message: 'Password changed successfully. Please log in again.' };
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      role: { select: { name: true } },
      _count: { select: { bookmarks: true, playlists: true, lessonProgress: true } },
    },
  });
  if (!user) throw new AppError(404, 'User not found.');
  return user;
}
