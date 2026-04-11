import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { AuthUser } from '../../middleware/authenticate';
import {
  hasLocationAccess,
  isSameClub,
  requireLocationAccess,
  requireLocationOwner,
} from '../../utils/locationAccess';

const NOTICE_EXPIRY_HOURS = 48;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function maskLocationFields(
  loc: {
    address?: string | null;
    scheduleInfo?: string | null;
    addressVisible: boolean;
    scheduleVisible: boolean;
    [key: string]: unknown;
  },
  isCoachOrAdmin: boolean,
) {
  return {
    ...loc,
    address: isCoachOrAdmin || loc.addressVisible ? loc.address : undefined,
    scheduleInfo: isCoachOrAdmin || loc.scheduleVisible ? loc.scheduleInfo : undefined,
  };
}

// ─── Location CRUD ────────────────────────────────────────────────────────────

export async function listMyLocations(user: AuthUser) {
  if (!user.clubId) return [];
  const locations = await prisma.location.findMany({
    where: { clubId: user.clubId, isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { classrooms: true, notices: true } },
      coaches: {
        where: { userId: user.id },
        select: { role: true },
      },
    },
  });
  return locations.map((loc) => ({
    ...loc,
    myRole: loc.coaches[0]?.role ?? null,
  }));
}

export async function createLocation(
  user: AuthUser,
  data: {
    name: string;
    description?: string;
    address?: string;
    scheduleInfo?: string;
    addressVisible?: boolean;
    scheduleVisible?: boolean;
  },
) {
  if (!user.clubId) throw new AppError(403, 'You must belong to a club to create a location.');

  const location = await prisma.location.create({
    data: {
      clubId: user.clubId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      address: data.address?.trim() || null,
      scheduleInfo: data.scheduleInfo?.trim() || null,
      addressVisible: data.addressVisible ?? true,
      scheduleVisible: data.scheduleVisible ?? true,
    },
  });

  // Auto-add creator as owner coach
  await prisma.locationCoach.create({
    data: { locationId: location.id, userId: user.id, role: 'owner' },
  });

  return location;
}

export async function getLocation(locationId: number, user: AuthUser) {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: {
      club: { select: { id: true, name: true } },
      coaches: {
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
      },
      _count: { select: { classrooms: true, notices: true } },
    },
  });
  if (!location) throw new AppError(404, 'Location not found.');

  // Check visibility: same-club members/coaches can see it; others can't
  const isCoach = await hasLocationAccess(prisma, locationId, user);
  const sameClub = isCoach || (await isSameClub(prisma, locationId, user));

  if (!sameClub && user.role !== 'admin') {
    throw new AppError(404, 'Location not found.');
  }

  const myCoach = location.coaches.find((c) => c.userId === user.id);

  return {
    ...maskLocationFields(location, isCoach),
    myRole: myCoach?.role ?? null,
  };
}

export async function updateLocation(
  locationId: number,
  user: AuthUser,
  data: {
    name?: string;
    description?: string;
    address?: string;
    scheduleInfo?: string;
    addressVisible?: boolean;
    scheduleVisible?: boolean;
    isActive?: boolean;
  },
) {
  await requireLocationOwner(prisma, locationId, user);
  return prisma.location.update({
    where: { id: locationId },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description.trim() || null } : {}),
      ...(data.address !== undefined ? { address: data.address.trim() || null } : {}),
      ...(data.scheduleInfo !== undefined ? { scheduleInfo: data.scheduleInfo.trim() || null } : {}),
      ...(data.addressVisible !== undefined ? { addressVisible: data.addressVisible } : {}),
      ...(data.scheduleVisible !== undefined ? { scheduleVisible: data.scheduleVisible } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
}

export async function deleteLocation(locationId: number, user: AuthUser) {
  await requireLocationOwner(prisma, locationId, user);
  await prisma.location.delete({ where: { id: locationId } });
}

// ─── Classrooms at Location ───────────────────────────────────────────────────

export async function listLocationClassrooms(locationId: number, user: AuthUser) {
  const location = await prisma.location.findUnique({ where: { id: locationId }, select: { clubId: true } });
  if (!location) throw new AppError(404, 'Location not found.');

  const isCoach = await hasLocationAccess(prisma, locationId, user);

  if (isCoach) {
    // Coach/admin sees all classrooms at this location
    return prisma.classroom.findMany({
      where: { locationId },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, username: true, displayName: true } },
        _count: { select: { members: true, playlists: true } },
      },
    });
  }

  // Regular member: only see classrooms they belong to
  const memberClassrooms = await prisma.classroomMember.findMany({
    where: {
      userId: user.id,
      classroom: { locationId },
    },
    include: {
      classroom: {
        include: {
          owner: { select: { id: true, username: true, displayName: true } },
          _count: { select: { members: true, playlists: true } },
        },
      },
    },
  });

  if (memberClassrooms.length === 0) {
    throw new AppError(404, 'Location not found.');
  }

  return memberClassrooms.map((m) => m.classroom);
}

// ─── Coaches ──────────────────────────────────────────────────────────────────

export async function listLocationCoaches(locationId: number, user: AuthUser) {
  await requireLocationAccess(prisma, locationId, user);
  return prisma.locationCoach.findMany({
    where: { locationId },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true, email: true } },
    },
    orderBy: { addedAt: 'asc' },
  });
}

export async function addCoach(locationId: number, user: AuthUser, emailOrUsername: string, role: 'owner' | 'coach') {
  await requireLocationOwner(prisma, locationId, user);

  const location = await prisma.location.findUnique({ where: { id: locationId }, select: { clubId: true } });
  if (!location) throw new AppError(404, 'Location not found.');

  const target = await prisma.user.findFirst({
    where: { OR: [{ email: emailOrUsername }, { username: emailOrUsername }] },
    include: { role: true },
  });
  if (!target) throw new AppError(404, 'User not found.');
  if (target.role.name !== 'coach' && target.role.name !== 'club_admin' && target.role.name !== 'admin') {
    throw new AppError(400, 'The target user must have the coach role to be assigned to a location.');
  }
  if (target.clubId !== location.clubId && target.role.name !== 'admin') {
    throw new AppError(400, 'This user does not belong to the same club as this location.');
  }

  const existing = await prisma.locationCoach.findUnique({
    where: { locationId_userId: { locationId, userId: target.id } },
  });
  if (existing) throw new AppError(409, 'This user is already a coach at this location.');

  return prisma.locationCoach.create({
    data: { locationId, userId: target.id, role },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true, email: true } },
    },
  });
}

export async function removeCoach(locationId: number, user: AuthUser, targetUserId: number) {
  await requireLocationOwner(prisma, locationId, user);

  const entry = await prisma.locationCoach.findUnique({
    where: { locationId_userId: { locationId, userId: targetUserId } },
  });
  if (!entry) throw new AppError(404, 'Coach not found at this location.');

  // Prevent removing the last owner
  if (entry.role === 'owner') {
    const ownerCount = await prisma.locationCoach.count({
      where: { locationId, role: 'owner' },
    });
    if (ownerCount <= 1) {
      throw new AppError(400, 'Cannot remove the last owner from a location. Assign another owner first.');
    }
  }

  await prisma.locationCoach.delete({ where: { locationId_userId: { locationId, userId: targetUserId } } });
}

// ─── Notices ──────────────────────────────────────────────────────────────────

/** Check if user can view the notice board at this location */
async function canViewNotices(locationId: number, user: AuthUser): Promise<boolean> {
  if (user.role === 'admin') return true;
  const isCoach = await hasLocationAccess(prisma, locationId, user);
  if (isCoach) return true;
  // Check if user is a member of any classroom at this location
  const membership = await prisma.classroomMember.findFirst({
    where: { userId: user.id, classroom: { locationId } },
  });
  return membership !== null;
}

export async function listNotices(locationId: number, user: AuthUser) {
  const canView = await canViewNotices(locationId, user);
  if (!canView) throw new AppError(404, 'Location not found.');

  const isCoach = await hasLocationAccess(prisma, locationId, user);
  const now = new Date();

  const notices = await prisma.locationNotice.findMany({
    where: {
      locationId,
      OR: isCoach
        ? undefined // coaches see all statuses
        : [
            { status: 'published' },
            { status: 'approved' },
            // Author can see their own pending notices
            { status: 'pending', authorId: user.id, expiresAt: { gt: now } },
          ],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      reviewer: { select: { id: true, username: true, displayName: true } },
    },
  });

  // Lazy expiry: filter out expired pending notices for non-coaches
  if (!isCoach) {
    return notices.filter(
      (n) => n.status !== 'pending' || (n.expiresAt && n.expiresAt > now),
    );
  }
  return notices;
}

export async function createNotice(
  locationId: number,
  user: AuthUser,
  data: { title: string; content: string },
) {
  // Must be same-club coach/admin to post
  const location = await prisma.location.findUnique({ where: { id: locationId }, select: { clubId: true } });
  if (!location) throw new AppError(404, 'Location not found.');

  if (user.role !== 'admin') {
    if (!user.clubId || user.clubId !== location.clubId) {
      throw new AppError(403, 'You must belong to this club to post notices.');
    }
    if (!['club_admin', 'coach'].includes(user.role)) {
      throw new AppError(403, 'Only coaches and club admins can post notices.');
    }
  }

  const isAssignedCoach = await hasLocationAccess(prisma, locationId, user);

  let status = 'published';
  let expiresAt: Date | null = null;

  if (!isAssignedCoach && user.role !== 'admin') {
    // Substitute coach: goes to pending with 48h expiry
    status = 'pending';
    expiresAt = new Date(Date.now() + NOTICE_EXPIRY_HOURS * 60 * 60 * 1000);
  }

  return prisma.locationNotice.create({
    data: {
      locationId,
      authorId: user.id,
      title: data.title.trim(),
      content: data.content.trim(),
      status,
      expiresAt,
    },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });
}

export async function updateNotice(
  locationId: number,
  noticeId: number,
  user: AuthUser,
  data: { title?: string; content?: string },
) {
  const notice = await prisma.locationNotice.findUnique({ where: { id: noticeId } });
  if (!notice || notice.locationId !== locationId) throw new AppError(404, 'Notice not found.');

  const isCoach = await hasLocationAccess(prisma, locationId, user);
  const isAuthor = notice.authorId === user.id;

  if (!isCoach && !isAuthor && user.role !== 'admin') {
    throw new AppError(403, 'You cannot edit this notice.');
  }
  if (['approved', 'rejected', 'expired'].includes(notice.status)) {
    throw new AppError(400, 'Cannot edit a notice that has already been reviewed or expired.');
  }

  return prisma.locationNotice.update({
    where: { id: noticeId },
    data: {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.content !== undefined ? { content: data.content.trim() } : {}),
    },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
    },
  });
}

export async function deleteNotice(locationId: number, noticeId: number, user: AuthUser) {
  const notice = await prisma.locationNotice.findUnique({ where: { id: noticeId } });
  if (!notice || notice.locationId !== locationId) throw new AppError(404, 'Notice not found.');

  const isCoach = await hasLocationAccess(prisma, locationId, user);
  const isAuthor = notice.authorId === user.id;

  if (!isCoach && !isAuthor && user.role !== 'admin') {
    throw new AppError(403, 'You cannot delete this notice.');
  }

  await prisma.locationNotice.delete({ where: { id: noticeId } });
}

export async function approveNotice(locationId: number, noticeId: number, user: AuthUser) {
  await requireLocationAccess(prisma, locationId, user);

  const notice = await prisma.locationNotice.findUnique({ where: { id: noticeId } });
  if (!notice || notice.locationId !== locationId) throw new AppError(404, 'Notice not found.');
  if (notice.status !== 'pending') throw new AppError(400, 'Only pending notices can be approved.');

  const now = new Date();
  if (notice.expiresAt && notice.expiresAt < now) {
    throw new AppError(400, 'This notice has expired and can no longer be approved.');
  }

  return prisma.locationNotice.update({
    where: { id: noticeId },
    data: { status: 'approved', reviewedBy: user.id, reviewedAt: now },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      reviewer: { select: { id: true, username: true, displayName: true } },
    },
  });
}

export async function rejectNotice(locationId: number, noticeId: number, user: AuthUser) {
  await requireLocationAccess(prisma, locationId, user);

  const notice = await prisma.locationNotice.findUnique({ where: { id: noticeId } });
  if (!notice || notice.locationId !== locationId) throw new AppError(404, 'Notice not found.');
  if (notice.status !== 'pending') throw new AppError(400, 'Only pending notices can be rejected.');

  return prisma.locationNotice.update({
    where: { id: noticeId },
    data: { status: 'rejected', reviewedBy: user.id, reviewedAt: new Date() },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
    },
  });
}
