import { Request, Response, NextFunction } from 'express';
import * as tagsService from './tags.service';
import { sendSuccess } from '../../utils/apiResponse';

export async function listTags(_req: Request, res: Response, next: NextFunction) {
  try {
    const tags = await tagsService.listTags();
    sendSuccess(res, tags);
  } catch (err) {
    next(err);
  }
}

export async function createTag(req: Request, res: Response, next: NextFunction) {
  try {
    const tag = await tagsService.createTag(req.body.name);
    sendSuccess(res, tag, 201);
  } catch (err) {
    next(err);
  }
}

export async function deleteTag(req: Request, res: Response, next: NextFunction) {
  try {
    await tagsService.deleteTag(parseInt(req.params.id));
    sendSuccess(res, { message: 'Tag deleted.' });
  } catch (err) {
    next(err);
  }
}
