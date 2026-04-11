import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { AuthUser } from '../../middleware/authenticate';

/**
 * List all coaches belonging to the same club as the requesting Club Admin.
 */
export async function listClubCoaches(user: AuthUser) {
  if (!user.clubId) return [];

  const coachRole = await prisma.role.findUnique({ where: { name: 'coach' } });
  if (!coachRole) return [];

  return prisma.user.findMany({
    where: { clubId: user.clubId, roleId: coachRole.id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      locationCoaches: {
        include: {
          location: { select: { id: true, name: true } },
        },
      },
    },
  });
}

/**
 * Search users (by partial email or username) who can be promoted to coach.
 * Excludes users who are already coach/club_admin/admin, and users in other clubs.
 */
export async function searchUsersForPromotion(user: AuthUser, query: string) {
  if (!user.clubId) throw new AppError(403, 'You must belong to a club to manage coaches.');

  const promotableRoles = await prisma.role.findMany({
    where: { name: { in: ['user', 'collaborator'] } },
  });
  const roleIds = promotableRoles.map((r) => r.id);

  return prisma.user.findMany({
    where: {
      roleId: { in: roleIds },
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } },
        { displayName: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 20,
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      clubId: true,
      role: { select: { name: true } },
    },
  });
}

/**
 * Promote a user to the coach role and assign them to this club.
 * Club Admins can only promote users, not other Club Admins.
 */
export async function promoteToCoach(adminUser: AuthUser, targetUserId: number) {
  if (!adminUser.clubId) throw new AppError(403, 'You must belong to a club to manage coaches.');

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { role: true },
  });
  if (!target) throw new AppError(404, 'User not found.');
  if (['admin', 'club_admin'].includes(target.role.name)) {
    throw new AppError(400, 'Cannot change the role of an admin or club admin.');
  }
  if (target.role.name === 'coach') {
    throw new AppError(409, 'User is already a coach.');
  }

  const coachRole = await prisma.role.findUnique({ where: { name: 'coach' } });
  if (!coachRole) throw new AppError(500, 'Coach role not found. Please run database seed.');

  return prisma.user.update({
    where: { id: targetUserId },
    data: { roleId: coachRole.id, clubId: adminUser.clubId },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      role: { select: { name: true } },
      club: { select: { id: true, name: true } },
    },
  });
}

/**
 * Demote a coach back to user role and remove their club membership.
 */
export async function demoteCoach(adminUser: AuthUser, targetUserId: number) {
  if (!adminUser.clubId) throw new AppError(403, 'You must belong to a club to manage coaches.');

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { role: true },
  });
  if (!target) throw new AppError(404, 'User not found.');
  if (target.role.name !== 'coach') throw new AppError(400, 'User is not a coach.');
  if (target.clubId !== adminUser.clubId) {
    throw new AppError(403, 'You can only manage coaches within your own club.');
  }

  const userRole = await prisma.role.findUnique({ where: { name: 'user' } });
  if (!userRole) throw new AppError(500, 'User role not found.');

  // Remove from all location assignments within this club first
  await prisma.locationCoach.deleteMany({
    where: {
      userId: targetUserId,
      location: { clubId: adminUser.clubId },
    },
  });

  return prisma.user.update({
    where: { id: targetUserId },
    data: { roleId: userRole.id, clubId: null },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      role: { select: { name: true } },
    },
  });
}
