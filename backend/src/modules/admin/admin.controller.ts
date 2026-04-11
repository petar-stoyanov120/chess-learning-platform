import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as adminService from './admin.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createClubSchema = z.object({
  name: z.string().min(1, 'Club name is required.').max(100),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
});

const updateClubSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

const setRoleSchema = z.object({
  role: z.enum(['admin', 'club_admin', 'collaborator', 'coach', 'user']),
  clubId: z.number().int().positive().optional().nullable(),
});

function parseId(val: string): number {
  const n = parseInt(val, 10);
  if (isNaN(n)) throw new AppError(400, 'Invalid ID.');
  return n;
}

export async function getPending(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminService.getPendingSubmissions();
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await adminService.getDashboardStats();
    sendSuccess(res, stats);
  } catch (err) { next(err); }
}

export async function getRecentUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await adminService.getRecentUsers();
    sendSuccess(res, users);
  } catch (err) { next(err); }
}

// ─── Club management ──────────────────────────────────────────────────────────

export async function listClubs(_req: Request, res: Response, next: NextFunction) {
  try {
    const clubs = await adminService.listClubs();
    sendSuccess(res, clubs);
  } catch (err) { next(err); }
}

export async function createClub(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createClubSchema.parse(req.body);
    const club = await adminService.createClub(data);
    res.status(201).json({ data: club });
  } catch (err) { next(err); }
}

export async function updateClub(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const data = updateClubSchema.parse(req.body);
    const club = await adminService.updateClub(id, data);
    sendSuccess(res, club);
  } catch (err) { next(err); }
}

export async function deleteClub(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    await adminService.deleteClub(id);
    sendSuccess(res, { message: 'Club deleted.' });
  } catch (err) { next(err); }
}

// ─── User role assignment ─────────────────────────────────────────────────────

export async function setUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const { role, clubId } = setRoleSchema.parse(req.body);
    const result = await adminService.setUserRole(id, role, clubId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}
