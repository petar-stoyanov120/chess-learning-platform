import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { AuthUser } from '../middleware/authenticate';

type PrismaInstance = PrismaClient;

/**
 * Returns true if the user has any LocationCoach entry for this location,
 * OR if the user is a global admin.
 */
export async function hasLocationAccess(
  prisma: PrismaInstance,
  locationId: number,
  user: AuthUser,
): Promise<boolean> {
  if (user.role === 'admin') return true;
  const entry = await prisma.locationCoach.findUnique({
    where: { locationId_userId: { locationId, userId: user.id } },
  });
  return entry !== null;
}

/**
 * Returns true if the user is in the same club as the location (by clubId match).
 * Admins always return true. Used for cross-club read-only visibility.
 */
export async function isSameClub(
  prisma: PrismaInstance,
  locationId: number,
  user: AuthUser,
): Promise<boolean> {
  if (user.role === 'admin') return true;
  if (!user.clubId) return false;
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: { clubId: true },
  });
  if (!location) return false;
  return location.clubId === user.clubId;
}

/**
 * Throws 403/404 if the user cannot access this location.
 * Admins always pass. LocationCoach entries (any role) pass.
 * Returns the LocationCoach row (null for admins).
 */
export async function requireLocationAccess(
  prisma: PrismaInstance,
  locationId: number,
  user: AuthUser,
): Promise<{ role: string } | null> {
  if (user.role === 'admin') {
    const loc = await prisma.location.findUnique({ where: { id: locationId } });
    if (!loc) throw new AppError(404, 'Location not found.');
    return null;
  }
  const entry = await prisma.locationCoach.findUnique({
    where: { locationId_userId: { locationId, userId: user.id } },
  });
  if (!entry) {
    // Don't reveal whether the location exists to unauthorised users
    throw new AppError(404, 'Location not found.');
  }
  return entry;
}

/**
 * Throws 403 if the user is not the "owner" role at this location (or global admin).
 */
export async function requireLocationOwner(
  prisma: PrismaInstance,
  locationId: number,
  user: AuthUser,
): Promise<void> {
  if (user.role === 'admin') return;
  const entry = await prisma.locationCoach.findUnique({
    where: { locationId_userId: { locationId, userId: user.id } },
  });
  if (!entry || entry.role !== 'owner') {
    throw new AppError(403, 'Only the location owner can perform this action.');
  }
}

/**
 * Returns true if the user's clubId matches the location's clubId.
 * Used to check if a club_admin can manage this location.
 */
export async function isLocationInUserClub(
  prisma: PrismaInstance,
  locationId: number,
  clubId: number,
): Promise<boolean> {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: { clubId: true },
  });
  return location?.clubId === clubId;
}
