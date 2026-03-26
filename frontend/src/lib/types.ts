export interface Role {
  name: 'user' | 'collaborator' | 'admin';
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
  _count?: { bookmarks: number; playlists: number; lessonProgress: number };
}

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  role: 'user' | 'collaborator' | 'admin';
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
