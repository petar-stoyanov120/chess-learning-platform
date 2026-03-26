import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as playlistsService from './playlists.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

const createPlaylistSchema = z.object({
  name: z.string().min(1, 'Playlist name is required.').max(60, 'Playlist name must be at most 60 characters.'),
  description: z.string().max(300).optional(),
});

const updatePlaylistSchema = createPlaylistSchema.partial();

const addLessonSchema = z.object({
  lessonId: z.number().int().positive('Invalid lesson ID.'),
});

export async function listPlaylists(req: Request, res: Response, next: NextFunction) {
  try {
    const playlists = await playlistsService.listPlaylists(req.user!.id);
    sendSuccess(res, playlists);
  } catch (err) {
    next(err);
  }
}

export async function getPlaylist(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return next(new AppError(400, 'Invalid playlist ID.'));
    const playlist = await playlistsService.getPlaylist(id, req.user!.id);
    sendSuccess(res, playlist);
  } catch (err) {
    next(err);
  }
}

export async function createPlaylist(req: Request, res: Response, next: NextFunction) {
  try {
    const result = createPlaylistSchema.safeParse(req.body);
    if (!result.success) return next(new AppError(400, result.error.errors[0].message));
    const playlist = await playlistsService.createPlaylist(req.user!.id, result.data);
    sendSuccess(res, playlist, 201);
  } catch (err) {
    next(err);
  }
}

export async function updatePlaylist(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return next(new AppError(400, 'Invalid playlist ID.'));
    const result = updatePlaylistSchema.safeParse(req.body);
    if (!result.success) return next(new AppError(400, result.error.errors[0].message));
    const playlist = await playlistsService.updatePlaylist(id, req.user!.id, result.data);
    sendSuccess(res, playlist);
  } catch (err) {
    next(err);
  }
}

export async function deletePlaylist(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return next(new AppError(400, 'Invalid playlist ID.'));
    await playlistsService.deletePlaylist(id, req.user!.id);
    sendSuccess(res, { message: 'Playlist deleted.' });
  } catch (err) {
    next(err);
  }
}

export async function addLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return next(new AppError(400, 'Invalid playlist ID.'));
    const result = addLessonSchema.safeParse(req.body);
    if (!result.success) return next(new AppError(400, result.error.errors[0].message));
    const entry = await playlistsService.addLesson(id, req.user!.id, result.data.lessonId);
    sendSuccess(res, entry, 201);
  } catch (err) {
    next(err);
  }
}

export async function removeLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const playlistId = parseInt(req.params.id);
    const lessonId = parseInt(req.params.lessonId);
    if (isNaN(playlistId) || isNaN(lessonId)) return next(new AppError(400, 'Invalid ID.'));
    await playlistsService.removeLesson(playlistId, req.user!.id, lessonId);
    sendSuccess(res, { message: 'Lesson removed from playlist.' });
  } catch (err) {
    next(err);
  }
}
