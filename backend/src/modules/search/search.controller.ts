import { Request, Response, NextFunction } from 'express';
import * as searchService from './search.service';

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await searchService.search(req.query as Record<string, string>);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
