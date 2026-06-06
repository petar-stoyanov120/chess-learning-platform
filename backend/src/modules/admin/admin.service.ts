import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

// ─── Club management ──────────────────────────────────────────────────────────

export async function listClubs() {
  return prisma.club.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { members: true, locations: true } },
    },
  });
}

export async function createClub(data: { name: string; description?: string; logoUrl?: string }) {
  return prisma.club.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      logoUrl: data.logoUrl?.trim() || null,
    },
  });
}

export async function updateClub(
  clubId: number,
  data: { name?: string; description?: string; logoUrl?: string; isActive?: boolean },
) {
  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) throw new AppError(404, 'Club not found.');
  return prisma.club.update({
    where: { id: clubId },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description.trim() || null } : {}),
      ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl.trim() || null } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
}

export async function deleteClub(clubId: number) {
  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) throw new AppError(404, 'Club not found.');
  await prisma.club.delete({ where: { id: clubId } });
}

// ─── User role management with clubId support ────────────────────────────────

export async function setUserRole(
  userId: number,
  roleName: string,
  clubId?: number | null,
) {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw new AppError(400, `Role '${roleName}' does not exist.`);

  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!user) throw new AppError(404, 'User not found.');

  // Roles that require a clubId
  const clubRoles = ['club_admin', 'coach'];
  if (clubRoles.includes(roleName) && !clubId) {
    throw new AppError(400, `Role '${roleName}' requires a clubId to be specified.`);
  }
  // Roles that should clear clubId
  const noClubRoles = ['admin', 'user'];
  const resolvedClubId = noClubRoles.includes(roleName) ? null : (clubId ?? null);

  // Validate club exists if provided
  if (resolvedClubId) {
    const club = await prisma.club.findUnique({ where: { id: resolvedClubId } });
    if (!club) throw new AppError(400, 'The specified club does not exist.');
  }

  return prisma.user.update({
    where: { id: userId },
    data: { roleId: role.id, clubId: resolvedClubId },
    select: {
      id: true,
      username: true,
      email: true,
      role: { select: { name: true } },
      club: { select: { id: true, name: true } },
    },
  });
}

export async function getRecentUsers(take = 5) {
  return prisma.user.findMany({
    where: { deletedAt: null },
    take,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      isActive: true,
      role: { select: { name: true } },
    },
  });
}

export async function getDashboardStats() {
  const [
    totalUsers,
    totalLessons,
    draftLessons,
    readyLessons,
    totalClassrooms,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.lesson.count({ where: { deletedAt: null } }),
    prisma.lesson.count({ where: { status: 'draft', deletedAt: null } }),
    prisma.lesson.count({ where: { status: 'ready', deletedAt: null } }),
    prisma.classroom.count({ where: { deletedAt: null } }),
  ]);

  return {
    users: totalUsers,
    classrooms: totalClassrooms,
    lessons: {
      total: totalLessons,
      draft: draftLessons,
      ready: readyLessons,
    },
  };
}
