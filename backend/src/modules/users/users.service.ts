import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';

const userSelect = {
  id: true,
  email: true,
  username: true,
  isActive: true,
  failedLoginAttempts: true,
  lockedUntil: true,
  createdAt: true,
  role: { select: { name: true } },
};

export async function listUsers(query: { page?: string; limit?: string; search?: string }) {
  const { page, limit, skip } = getPagination(query);
  const where = query.search
    ? {
        deletedAt: null,
        OR: [
          { email: { contains: query.search, mode: 'insensitive' as const } },
          { username: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }
    : { deletedAt: null };

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, select: userSelect }),
    prisma.user.count({ where }),
  ]);

  return { users, meta: buildPaginationMeta(total, page, limit) };
}

export async function getUser(id: number) {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: userSelect });
  if (!user) throw new AppError(404, 'User not found.');
  return user;
}

export async function updateUserRole(id: number, roleName: string) {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw new AppError(400, 'Invalid role name.');
  return prisma.user.update({ where: { id }, data: { roleId: role.id }, select: userSelect });
}

export async function updateUserStatus(id: number, isActive: boolean) {
  return prisma.user.update({ where: { id }, data: { isActive }, select: userSelect });
}

export async function unlockUser(id: number) {
  return prisma.user.update({
    where: { id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
    select: userSelect,
  });
}

/** Soft delete: mark the user deleted so they drop out of normal reads and can no
 *  longer authenticate, while their authored lessons and progress are preserved. */
export async function deleteUser(id: number) {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!user) throw new AppError(404, 'User not found.');
  await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
}

/** Admin-only: list soft-deleted users (e.g. to action GDPR erasure). */
export async function listDeletedUsers(query: { page?: string; limit?: string }) {
  const { page, limit, skip } = getPagination(query);
  const where = { deletedAt: { not: null } };
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: limit, orderBy: { updatedAt: 'desc' }, select: userSelect }),
    prisma.user.count({ where }),
  ]);
  return { users, meta: buildPaginationMeta(total, page, limit) };
}

/** Admin-only: permanently remove a user (cascades to their lessons, progress,
 *  memberships, submissions, etc.). For genuine data removal / GDPR erasure. */
export async function hardDeleteUser(id: number) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'User not found.');
  await prisma.user.delete({ where: { id } });
}
