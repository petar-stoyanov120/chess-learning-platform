/**
 * Centralized authorization types.
 *
 * `can(user, action, subject)` (see ./can) is the single source of truth for
 * "who can do what". This file defines the three inputs to that function:
 *   - PolicyUser: the minimal authenticated identity needed for a decision
 *   - Action:     the verb being attempted
 *   - Subject:    a discriminated union carrying the target resource's facts
 *                 plus any relational flags the decision depends on
 *
 * Subjects deliberately carry *precomputed* relational flags (isOwner,
 * locationRole, sameClub, …) rather than raw entities, so `can()` stays pure
 * and synchronous. The async work of gathering those flags lives in ./context
 * and ./guards.
 */

export type Role = 'admin' | 'club_admin' | 'coach' | 'user';

/** Minimal identity a policy decision needs. A subset of AuthUser. */
export interface PolicyUser {
  id: number;
  role: string;
  clubId: number | null;
}

/** The role a user holds at a specific location, or null if none. */
export type LocationRole = 'owner' | 'coach' | null;

export type Action =
  // Classroom
  | 'create'
  | 'view'
  | 'manage'
  | 'delete'
  // Classroom puzzle
  | 'viewSolution'
  // Location notice
  | 'viewBoard'
  | 'edit'
  // Location notice moderation / location coach moderation
  | 'moderate'
  // Lesson library
  | 'setStatus'
  | 'reorder'
  // Member / Club
  | 'manageClubCoaches';

export type Subject =
  | { type: 'Classroom'; isOwner: boolean; isMember: boolean; isActive: boolean }
  | { type: 'ClassroomPuzzle'; isOwner: boolean }
  | { type: 'Location'; locationRole: LocationRole; sameClub: boolean }
  | {
      type: 'LocationNotice';
      locationRole: LocationRole;
      sameClub: boolean;
      isAuthor: boolean;
      isMemberAtLocation: boolean;
    }
  | { type: 'Lesson'; isAuthor: boolean }
  | { type: 'Member'; sameClub: boolean }
  | { type: 'Club' };
