export type UserRole = 'admin' | 'club_admin' | 'collaborator' | 'coach' | 'user';

export interface Role {
  name: UserRole;
}

export interface Club {
  id: number;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  _count?: { members: number; locations: number };
}

export interface User {
  id: number;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isActive: boolean;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  createdAt: string;
  role: Role;
  clubId?: number | null;
  club?: { id: number; name: string } | null;
  _count?: { bookmarks: number; playlists: number; lessonProgress: number };
}

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  clubId?: number | null;
  club?: { id: number; name: string } | null;
}

// ─── Locations ────────────────────────────────────────────────────────────────

export interface LocationCoachUser {
  id: number;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  email: string;
}

export interface LocationCoach {
  id: number;
  locationId: number;
  userId: number;
  role: 'owner' | 'coach';
  addedAt: string;
  user: LocationCoachUser;
}

export type LocationNoticeStatus = 'published' | 'pending' | 'approved' | 'rejected' | 'expired';

export interface LocationNotice {
  id: number;
  locationId: number;
  authorId: number;
  title: string;
  content: string;
  status: LocationNoticeStatus;
  expiresAt?: string | null;
  reviewedBy?: number | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author?: { id: number; username: string; displayName?: string | null; avatarUrl?: string | null };
  reviewer?: { id: number; username: string; displayName?: string | null } | null;
}

export interface Location {
  id: number;
  clubId: number;
  club?: { id: number; name: string };
  name: string;
  description?: string | null;
  address?: string | null;
  scheduleInfo?: string | null;
  addressVisible: boolean;
  scheduleVisible: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  coaches?: LocationCoach[];
  myRole?: 'owner' | 'coach' | null;
  _count?: { classrooms: number; notices: number };
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  _count?: { lessons: number };
}

export interface DifficultyLevel {
  id: number;
  name: 'beginner' | 'intermediate' | 'advanced';
  sortOrder: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface PostStatus {
  id: number;
  name: 'draft' | 'pending_review' | 'published' | 'rejected';
}

export interface LessonDiagram {
  id: number;
  fen: string;
  caption?: string;
  sortOrder: number;
}

export interface Variation {
  id: number;
  name: string;
  notation: string;
  sortOrder: number;
}

export interface LessonSummary {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  coverImageUrl?: string;
  readingTime?: number;
  viewCount?: number;
  sortOrder: number;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  author: { id: number; username: string };
  category: { id: number; name: string; slug: string };
  level: { id: number; name: string; sortOrder: number };
  status: PostStatus;
  lessonTags: { tag: Tag }[];
  diagrams: LessonDiagram[];
  variations: Variation[];
}

export interface Lesson extends LessonSummary {
  content: string;
  metaDescription?: string;
  rejectionReason?: string;
  readingTime?: number;
}

export interface BlogPostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  coverImageUrl?: string;
  readingTime?: number;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  author: { id: number; username: string };
  status: PostStatus;
  blogPostTags: { tag: Tag }[];
  rejectionReason?: string;
  variations: Variation[];
}

export interface BlogPost extends BlogPostSummary {
  content: string;
  metaDescription?: string;
  readingTime?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface Bookmark {
  id: number;
  lessonId: number;
  createdAt: string;
}

export interface Playlist {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { lessons: number };
}

export interface PlaylistLesson {
  id: number;
  playlistId: number;
  lessonId: number;
  addedAt: string;
  sortOrder: number;
}

// ─── Classroom / Club System ──────────────────────────────────────────────────

export interface ClassroomOwner {
  id: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface Classroom {
  id: number;
  name: string;
  description?: string | null;
  inviteCode: string;
  ownerId: number;
  locationId?: number | null;
  ageMin?: number | null;
  ageMax?: number | null;
  isActive: boolean;
  tier: 'free' | 'premium';
  createdAt: string;
  updatedAt: string;
  owner?: ClassroomOwner;
  location?: { id: number; name: string } | null;
  _count?: { members: number; playlists: number };
  isOwner?: boolean;
  joinedAt?: string;
}

export interface ClassroomMember {
  id: number;
  classroomId: number;
  userId: number;
  joinedAt: string;
  user: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    email: string;
  };
}

export interface ClassroomPlaylistLesson {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  coverImageUrl?: string;
  readingTime?: number;
  sortOrder: number;
  teacherNote?: string | null;
  completed?: boolean;
  author: { id: number; username: string };
  category: { id: number; name: string; slug: string };
  level: { id: number; name: string; sortOrder: number };
  status: PostStatus;
}

export interface ClassroomPlaylist {
  id: number;
  classroomId: number;
  name: string;
  description?: string | null;
  teacherIntro?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: { lessons: number };
  lessons?: ClassroomPlaylistLesson[];
}

export interface ClassroomProgress {
  user: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  completedCount: number;
  totalCount: number;
  percent: number;
}

// ─── Classroom Puzzles ────────────────────────────────────────────────────────

export interface ClassroomPuzzle {
  id: number;
  classroomId: number;
  lessonId?: number | null;
  title: string;
  description?: string | null;
  fen: string;
  sideToMove: string;
  solution?: string | null;
  maxMoves?: number | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { submissions: number };
}

export interface ClassroomLesson {
  id: number;
  classroomId: number;
  title: string;
  content?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  puzzles?: ClassroomPuzzle[];
  _count?: { puzzles: number };
}

export interface ClassroomPuzzleSubmission {
  id: number;
  puzzleId: number;
  userId: number;
  notation: string;
  notes?: string | null;
  submittedAt: string;
  updatedAt: string;
  reviewedAt?: string | null;
  isCorrect?: boolean | null;
  coachFeedback?: string | null;
  user?: { id: number; username: string; displayName?: string | null; avatarUrl?: string | null };
}

// ─── Comments & Ratings ───────────────────────────────────────────────────────

export interface Comment {
  id: number;
  lessonId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: { id: number; username: string; displayName?: string; avatarUrl?: string };
}
