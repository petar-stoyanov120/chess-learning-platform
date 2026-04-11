import { API_URL } from './constants';
import type { UserRole } from './types';

export function getBaseUrl(): string {
  try {
    const url = new URL(API_URL);
    return `${url.protocol}//${url.host}`;
  } catch {
    return API_URL.replace(/\/api\/v\d+$/, '');
  }
}

/**
 * Returns a human-friendly role label.
 * For club_admin and coach roles, prepends the club name when available.
 * e.g. "Chess Knights Admin" or "Chess Knights Coach"
 */
export function getRoleDisplayName(role: UserRole, clubName?: string | null): string {
  switch (role) {
    case 'admin':        return 'Admin';
    case 'club_admin':   return clubName ? `${clubName} Admin` : 'Club Admin';
    case 'collaborator': return 'Collaborator';
    case 'coach':        return clubName ? `${clubName} Coach` : 'Coach';
    case 'user':         return 'Member';
    default:             return 'Member';
  }
}
