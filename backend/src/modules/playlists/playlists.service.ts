import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getStatusId } from '../../config/statusCache';

const MAX_PLAYLISTS = 5;

const lessonSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  readingTime: true,
  createdAt: true,
  author: { select: { id: true, username: true } },
  category: { select: { id: true, name: true, slug: true } },
  level: { select: { id: true, name: true, sortOrder: true } },
  status: { select: { id: true, name: true } },
  lessonTags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
};

export async function listPlaylists(userId: number) {
  return prisma.playlist.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { lessons: true } } },
  });
}

export async function getPlaylist(id: number, userId: number) {
  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: {
      lessons: {
        orderBy: { sortOrder: 'asc' },
        include: { lesson: { select: lessonSelect } },
      },
    },
  });
  if (!playlist) throw new AppError(404, 'Playlist not found.');
  if (playlist.userId !== userId && !playlist.isPublic) {
    throw new AppError(403, 'You do not have access to this playlist.');
  }
  return {
    ...playlist,
    lessons: playlist.lessons.map((pl) => ({
      ...pl.lesson,
      sortOrder: pl.sortOrder,
      addedAt: pl.addedAt,
    })),
  };
}

export async function createPlaylist(userId: number, data: { name: string; description?: string }) {
  const count = await prisma.playlist.count({ where: { userId } });
  if (count >= MAX_PLAYLISTS) {
    throw new AppError(400, `You can create up to ${MAX_PLAYLISTS} playlists.`);
  }

  return prisma.playlist.create({
    data: { userId, name: data.name.trim(), description: data.description?.trim() },
    include: { _count: { select: { lessons: true } } },
  });
}

export async function updatePlaylist(id: number, userId: number, data: { name?: string; description?: string }) {
  const playlist = await prisma.playlist.findUnique({ where: { id } });
  if (!playlist) throw new AppError(404, 'Playlist not found.');
  if (playlist.userId !== userId) throw new AppError(403, 'You can only edit your own playlists.');

  return prisma.playlist.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description.trim() || null } : {}),
    },
    include: { _count: { select: { lessons: true } } },
  });
}

export async function deletePlaylist(id: number, userId: number) {
  const playlist = await prisma.playlist.findUnique({ where: { id } });
  if (!playlist) throw new AppError(404, 'Playlist not found.');
  if (playlist.userId !== userId) throw new AppError(403, 'You can only delete your own playlists.');

  await prisma.playlist.delete({ where: { id } });
}

export async function addLesson(playlistId: number, userId: number, lessonId: number) {
  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
  if (!playlist) throw new AppError(404, 'Playlist not found.');
  if (playlist.userId !== userId) throw new AppError(403, 'You can only modify your own playlists.');

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson || lesson.statusId !== getStatusId('published')) {
    throw new AppError(404, 'Lesson not found.');
  }

  const existing = await prisma.playlistLesson.findUnique({
    where: { playlistId_lessonId: { playlistId, lessonId } },
  });
  if (existing) return existing;

  const maxSort = await prisma.playlistLesson.aggregate({
    where: { playlistId },
    _max: { sortOrder: true },
  });

  return prisma.playlistLesson.create({
    data: { playlistId, lessonId, sortOrder: (maxSort._max.sortOrder ?? -1) + 1 },
  });
}

export async function removeLesson(playlistId: number, userId: number, lessonId: number) {
  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
  if (!playlist) throw new AppError(404, 'Playlist not found.');
  if (playlist.userId !== userId) throw new AppError(403, 'You can only modify your own playlists.');

  const existing = await prisma.playlistLesson.findUnique({
    where: { playlistId_lessonId: { playlistId, lessonId } },
  });
  if (!existing) throw new AppError(404, 'Lesson not in this playlist.');

  await prisma.playlistLesson.delete({ where: { id: existing.id } });
}
