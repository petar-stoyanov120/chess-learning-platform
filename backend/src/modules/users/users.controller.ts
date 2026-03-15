import { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { users, meta } = await usersService.listUsers(req.query as Record<string, string>);
    sendPaginated(res, users, meta);
  } catch (err) {
    next(err);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getUser(parseInt(req.params.id));
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateUserRole(parseInt(req.params.id), req.body.role);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateUserStatus(parseInt(req.params.id), req.body.isActive);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function unlockUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.unlockUser(parseInt(req.params.id));
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    await usersService.deleteUser(parseInt(req.params.id));
    sendSuccess(res, { message: 'User deleted.' });
  } catch (err) {
    next(err);
  }
}
