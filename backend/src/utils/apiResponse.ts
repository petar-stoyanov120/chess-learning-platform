import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ data });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: object,
  statusCode = 200
): void {
  res.status(statusCode).json({ data, meta });
}
