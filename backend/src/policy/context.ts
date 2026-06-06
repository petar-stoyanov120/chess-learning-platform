/**
 * Async helpers that gather the relational facts the policy decision depends on.
 *
 * These replace the boolean predicates that previously lived in
 * utils/locationAccess.ts. They return RAW facts (no admin shortcut baked in) —
 * the admin override lives in the decision table in ./can — except where a
 * service needs an admin-inclusive boolean for non-authorization logic (e.g.
 * field masking), in which case it composes the raw fact with the role itself.
 */

import { PrismaClient } from '@prisma/client';
import { LocationRole, PolicyUser } from './types';

type PrismaInstance = PrismaClient;

/** The role the user holds at this location via a LocationCoach row, or null. */
export async function getLocationRole(
  prisma: PrismaInstance,
  locationId: number,
  userId: number,
): Promise<LocationRole> {
  const entry = await prisma.locationCoach.findUnique({
    where: { locationId_userId: { locationId, userId } },
  });
  return entry ? (entry.role as LocationRole) : null;
}

/** Pure: does the user belong to the same club as a resource with this clubId. */
export function sameClub(user: PolicyUser, resourceClubId: number | null | undefined): boolean {
  return user.clubId != null && user.clubId === resourceClubId;
}

/**
 * Admin-inclusive "can touch this location" check used by callers that need a
 * single boolean (classroom creation, notice authoring). Mirrors the old
 * hasLocationAccess: admins always pass; otherwise an assigned coach passes.
 */
export async function userHasLocationAccess(
  prisma: PrismaInstance,
  locationId: number,
  user: PolicyUser,
): Promise<boolean> {
  if (user.role === 'admin') return true;
  return (await getLocationRole(prisma, locationId, user.id)) !== null;
}

/** Is the user enrolled in any classroom at this location. */
export async function isClassroomMemberAtLocation(
  prisma: PrismaInstance,
  locationId: number,
  userId: number,
): Promise<boolean> {
  const membership = await prisma.classroomMember.findFirst({
    where: { userId, classroom: { locationId } },
  });
  return membership !== null;
}
