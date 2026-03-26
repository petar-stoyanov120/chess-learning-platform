import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as blogService from './blog.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import { variationSchema } from '../../schemas/common';

const createPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.').max(200, 'Title must be at most 200 characters.'),
  content: z.string().min(1, 'Content is required.'),
  excerpt: z.string().max(500).optional(),
  coverImageUrl: z.string().url('Cover image must be a valid URL.').optional().or(z.literal('')),
  metaDescription: z.string().max(300, 'Meta description must be at most 300 characters.').optional(),
  tagIds: z.array(z.number().int().positive()).optional(),
  variations: z.array(variationSchema).optional(),
});

const updatePostSchema = createPostSchema.partial();

export async function listPublished(req: Request, res: Response, next: NextFunction) {
  try {
    const { posts, meta } = await blogService.listPublishedPosts(req.query as Record<string, string>);
    sendPaginated(res, posts, meta);
  } catch (err) { next(err); }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await blogService.getPostBySlug(req.params.slug);
    sendSuccess(res, post);
  } catch (err) { next(err); }
}

export async function getMyPost(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await blogService.getMyPostById(parseInt(req.params.id), req.user!.id);
    sendSuccess(res, post);
  } catch (err) { next(err); }
}

export async function getAdminPost(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await blogService.getPostById(parseInt(req.params.id));
    sendSuccess(res, post);
  } catch (err) { next(err); }
}

export async function createPost(req: Request, res: Response, next: NextFunction) {
  try {
    const result = createPostSchema.safeParse(req.body);
    if (!result.success) return next(new AppError(400, result.error.errors[0].message));
    const post = await blogService.createPost(req.user!.id, req.user!.role, result.data);
    sendSuccess(res, post, 201);
  } catch (err) { next(err); }
}

export async function updatePost(req: Request, res: Response, next: NextFunction) {
  try {
    const result = updatePostSchema.safeParse(req.body);
    if (!result.success) return next(new AppError(400, result.error.errors[0].message));
    const post = await blogService.updatePost(parseInt(req.params.id), req.user!.id, req.user!.role, result.data);
    sendSuccess(res, post);
  } catch (err) { next(err); }
}

export async function submitPost(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await blogService.submitPost(parseInt(req.params.id), req.user!.id, req.user!.role);
    sendSuccess(res, post);
  } catch (err) { next(err); }
}

export async function approvePost(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await blogService.approvePost(parseInt(req.params.id), req.user!.id);
    sendSuccess(res, post);
  } catch (err) { next(err); }
}

export async function rejectPost(req: Request, res: Response, next: NextFunction) {
  try {
    const result = z.object({ reason: z.string().min(1, 'Rejection reason is required.') }).safeParse(req.body);
    if (!result.success) return next(new AppError(400, result.error.errors[0].message));
    const post = await blogService.rejectPost(parseInt(req.params.id), result.data.reason);
    sendSuccess(res, post);
  } catch (err) { next(err); }
}

export async function deletePost(req: Request, res: Response, next: NextFunction) {
  try {
    await blogService.deletePost(parseInt(req.params.id));
    sendSuccess(res, { message: 'Blog post deleted.' });
  } catch (err) { next(err); }
}

export async function listAllAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { posts, meta } = await blogService.listAllPosts(req.query as Record<string, string>);
    sendPaginated(res, posts, meta);
  } catch (err) { next(err); }
}

export async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    const { posts, meta } = await blogService.listMyPosts(req.user!.id, req.query as Record<string, string>);
    sendPaginated(res, posts, meta);
  } catch (err) { next(err); }
}
