import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as service from './locations.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required.').max(100),
  description: z.string().max(500).optional(),
  address: z.string().max(300).optional(),
  scheduleInfo: z.string().max(1000).optional(),
  addressVisible: z.boolean().optional(),
  scheduleVisible: z.boolean().optional(),
});

const updateLocationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  address: z.string().max(300).optional(),
  scheduleInfo: z.string().max(1000).optional(),
  addressVisible: z.boolean().optional(),
  scheduleVisible: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const addCoachSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required.'),
  role: z.enum(['owner', 'coach']).default('coach'),
});

const createNoticeSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(200),
  content: z.string().min(1, 'Content is required.'),
});

const updateNoticeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
});

function parseId(val: string): number {
  const n = parseInt(val, 10);
  if (isNaN(n)) throw new AppError(400, 'Invalid ID.');
  return n;
}

// ─── Controllers ──────────────────────────────────────────────────────────────

export async function listLocations(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.listMyLocations(req.user!);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function createLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createLocationSchema.parse(req.body);
    const result = await service.createLocation(req.user!, data);
    res.status(201).json({ data: result });
  } catch (err) { next(err); }
}

export async function getLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const result = await service.getLocation(id, req.user!);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function updateLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const data = updateLocationSchema.parse(req.body);
    const result = await service.updateLocation(id, req.user!, data);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function deleteLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    await service.deleteLocation(id, req.user!);
    sendSuccess(res, { message: 'Location deleted successfully.' });
  } catch (err) { next(err); }
}

export async function listLocationClassrooms(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const result = await service.listLocationClassrooms(id, req.user!);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function listCoaches(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const result = await service.listLocationCoaches(id, req.user!);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function addCoach(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const data = addCoachSchema.parse(req.body);
    const result = await service.addCoach(id, req.user!, data.emailOrUsername, data.role);
    res.status(201).json({ data: result });
  } catch (err) { next(err); }
}

export async function removeCoach(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const userId = parseId(req.params.userId);
    await service.removeCoach(id, req.user!, userId);
    sendSuccess(res, { message: 'Coach removed from location.' });
  } catch (err) { next(err); }
}

export async function listNotices(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const result = await service.listNotices(id, req.user!);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function createNotice(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const data = createNoticeSchema.parse(req.body);
    const result = await service.createNotice(id, req.user!, data);
    res.status(201).json({ data: result });
  } catch (err) { next(err); }
}

export async function updateNotice(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const nid = parseId(req.params.nid);
    const data = updateNoticeSchema.parse(req.body);
    const result = await service.updateNotice(id, nid, req.user!, data);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function deleteNotice(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const nid = parseId(req.params.nid);
    await service.deleteNotice(id, nid, req.user!);
    sendSuccess(res, { message: 'Notice deleted.' });
  } catch (err) { next(err); }
}

export async function approveNotice(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const nid = parseId(req.params.nid);
    const result = await service.approveNotice(id, nid, req.user!);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function rejectNotice(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const nid = parseId(req.params.nid);
    const result = await service.rejectNotice(id, nid, req.user!);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}
