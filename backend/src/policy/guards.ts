/**
 * Async authorization guards used by services.
 *
 * Each guard: fetches the target entity (404 if missing), gathers the relational
 * flags via ./context, builds the Subject, asks ./can for the decision, and on
 * denial throws the original AppError (same status code + message as the
 * pre-refactor inline checks). On success it RETURNS the fetched entity (and any
 * useful flags) so callers don't re-fetch the same row — audit finding M1.
 */

import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { can } from './can';
import { getLocationRole, sameClub } from './context';
import { LocationRole, PolicyUser } from './types';

type PrismaInstance = PrismaClient;

// ─── Classroom ────────────────────────────────────────────────────────────────

/**
 * Verify the user may read a classroom (owner or enrolled member, and the
 * classroom is active). Returns the classroom row (with the requester's
 * membership included).
 */
export async function requireClassroomAccess(
  prisma: PrismaInstance,
  classroomId: number,
  user: PolicyUser,
) {
  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, deletedAt: null },
    include: { members: { where: { userId: user.id } } },
  });
  if (!classroom) throw new AppError(404, 'Classroom not found.');
  if (!classroom.isActive) throw new AppError(403, 'This classroom is no longer active.');

  const allowed = can(user, 'view', {
    type: 'Classroom',
    isOwner: classroom.ownerId === user.id,
    isMember: classroom.members.length > 0,
    isActive: classroom.isActive,
  });
  if (!allowed) throw new AppError(403, 'You are not a member of this classroom.');
  return classroom;
}

/** Verify the user owns a classroom (owner-only management). Returns the row. */
export async function requireClassroomOwner(
  prisma: PrismaInstance,
  classroomId: number,
  user: PolicyUser,
) {
  const classroom = await prisma.classroom.findFirst({ where: { id: classroomId, deletedAt: null } });
  if (!classroom) throw new AppError(404, 'Classroom not found.');

  const allowed = can(user, 'manage', {
    type: 'Classroom',
    isOwner: classroom.ownerId === user.id,
    isMember: false,
    isActive: classroom.isActive,
  });
  if (!allowed) throw new AppError(403, 'Only the classroom owner can perform this action.');
  return classroom;
}

// ─── Location ─────────────────────────────────────────────────────────────────

/**
 * Verify the user may moderate a location (list coaches, approve/reject notices):
 * admin, or any assigned coach. Hides existence (404) from unauthorised users,
 * matching the old requireLocationAccess. Returns the location and the user's role at it.
 */
export async function requireLocationModerate(
  prisma: PrismaInstance,
  locationId: number,
  user: PolicyUser,
): Promise<{ location: { id: number; clubId: number }; locationRole: LocationRole }> {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: { id: true, clubId: true },
  });
  if (!location) throw new AppError(404, 'Location not found.');

  const locationRole = await getLocationRole(prisma, locationId, user.id);
  const allowed = can(user, 'moderate', { type: 'Location', locationRole, sameClub: sameClub(user, location.clubId) });
  // Don't reveal whether the location exists to unauthorised users.
  if (!allowed) throw new AppError(404, 'Location not found.');
  return { location, locationRole };
}

/**
 * Verify the user owns a location (update/delete it, manage its coach roster):
 * admin or the location's owner coach. Returns the location and role.
 */
export async function requireLocationOwner(
  prisma: PrismaInstance,
  locationId: number,
  user: PolicyUser,
): Promise<{ location: { id: number; clubId: number }; locationRole: LocationRole }> {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: { id: true, clubId: true },
  });
  if (!location) throw new AppError(404, 'Location not found.');

  const locationRole = await getLocationRole(prisma, locationId, user.id);
  const allowed = can(user, 'manage', { type: 'Location', locationRole, sameClub: sameClub(user, location.clubId) });
  if (!allowed) throw new AppError(403, 'Only the location owner can perform this action.');
  return { location, locationRole };
}
