import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export async function updateProfile(userId: number, data: { displayName?: string }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found.');

  return prisma.user.update({
    where: { id: userId },
    data: { displayName: data.displayName?.trim() || null },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      role: { select: { name: true } },
      _count: { select: { bookmarks: true, playlists: true, lessonProgress: true } },
    },
  });
}
