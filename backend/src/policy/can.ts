/**
 * The single source of truth for authorization decisions.
 *
 * `can(user, action, subject)` is PURE and SYNCHRONOUS — it never touches the
 * database. All relational facts a decision needs are precomputed by the caller
 * (see ./guards and ./context) and passed in via the Subject. This keeps the
 * whole permission matrix in one readable place and makes it trivially unit
 * testable without a DB.
 *
 * NOTE: this table encodes the platform's CURRENT behaviour verbatim, including
 * deliberately-preserved quirks (classroom management is strictly owner-only;
 * admins override only on classroom delete and puzzle-solution visibility).
 */

import { Action, PolicyUser, Subject } from './types';

const PRIVILEGED_ROLES = ['admin', 'club_admin', 'coach'];

export function can(user: PolicyUser, action: Action, subject: Subject): boolean {
  switch (subject.type) {
    case 'Classroom':
      switch (action) {
        // Coaches, club admins and admins may create classrooms; students may not.
        case 'create':
          return user.role !== 'user';
        // Read access: the owner or an enrolled member. (The guard enforces the
        // "classroom is active" precondition before calling this.)
        case 'view':
          return subject.isOwner || subject.isMember;
        // All nested management (playlists, puzzles, members, classroom-lessons,
        // submission review) is owner-only. No admin/club_admin override — preserved.
        case 'manage':
          return subject.isOwner;
        // Delete is the one place admins override the owner.
        case 'delete':
          return subject.isOwner || user.role === 'admin';
        default:
          return false;
      }

    case 'ClassroomPuzzle':
      // Who may see a puzzle's solution: the classroom owner, or any
      // coach/club_admin/admin. Plain students never see solutions.
      if (action === 'viewSolution') {
        return subject.isOwner || PRIVILEGED_ROLES.includes(user.role);
      }
      return false;

    case 'Location':
      switch (action) {
        // Creating locations is gated to club admins and admins (the guard also
        // enforces club membership).
        case 'create':
          return user.role === 'admin' || user.role === 'club_admin';
        // Visibility: admins always; assigned coaches; same-club members.
        case 'view':
          return user.role === 'admin' || subject.locationRole !== null || subject.sameClub;
        // Mutating the location / its coach roster: admin or the location owner.
        case 'manage':
          return user.role === 'admin' || subject.locationRole === 'owner';
        // Listing coaches / approving-rejecting notices: admin or any assigned coach.
        case 'moderate':
          return user.role === 'admin' || subject.locationRole !== null;
        default:
          return false;
      }

    case 'LocationNotice':
      switch (action) {
        // Who may see the board: admin, any assigned coach, or a member of a
        // classroom at this location.
        case 'viewBoard':
          return (
            user.role === 'admin' ||
            subject.locationRole !== null ||
            subject.isMemberAtLocation
          );
        // Posting a notice: admin, or a same-club coach/club_admin. (The service
        // decides published-vs-pending from whether they're an assigned coach.)
        case 'create':
          return (
            user.role === 'admin' ||
            (subject.sameClub && (user.role === 'coach' || user.role === 'club_admin'))
          );
        // Editing/deleting a notice: admin, any assigned coach, or the author.
        case 'edit':
        case 'delete':
          return user.role === 'admin' || subject.locationRole !== null || subject.isAuthor;
        // Approve/reject: admin or any assigned coach.
        case 'moderate':
          return user.role === 'admin' || subject.locationRole !== null;
        default:
          return false;
      }

    case 'Lesson':
      // Internal coach-only lesson library. (Expressed for completeness; the
      // lessons service is not yet wired to this layer.)
      switch (action) {
        case 'view':
        case 'create':
          return PRIVILEGED_ROLES.includes(user.role);
        case 'manage':
        case 'setStatus':
          return user.role === 'admin' || subject.isAuthor;
        case 'delete':
        case 'reorder':
          return user.role === 'admin';
        default:
          return false;
      }

    case 'Member':
      // Promoting/demoting club coaches: a club admin (within their own club) or admin.
      if (action === 'manageClubCoaches') {
        return user.role === 'admin' || (user.role === 'club_admin' && subject.sameClub);
      }
      return false;

    case 'Club':
      // Club CRUD is admin-only.
      if (action === 'manage') {
        return user.role === 'admin';
      }
      return false;

    default:
      return false;
  }
}
