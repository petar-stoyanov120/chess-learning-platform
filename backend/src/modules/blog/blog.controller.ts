import { Request, Response, NextFunction } from 'express';
import * as blogService from './blog.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

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
    const post = await blogService.createPost(req.user!.id, req.user!.role, req.body);
    sendSuccess(res, post, 201);
  } catch (err) { next(err); }
}

export async function updatePost(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await blogService.updatePost(parseInt(req.params.id), req.user!.id, req.user!.role, req.body);
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
    const reason = req.body.reason as string;
    if (!reason) return next(new AppError(400, 'Rejection reason is required.'));
    const post = await blogService.rejectPost(parseInt(req.params.id), reason);
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
