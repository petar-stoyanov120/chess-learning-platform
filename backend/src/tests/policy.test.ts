import { can } from '../policy/can';
import { PolicyUser, Role } from '../policy/types';

/**
 * Pure unit tests for the authorization decision table. No database — every fact
 * a decision needs is passed in via the Subject, so these assert the can() matrix
 * directly. This locks in the platform's CURRENT behaviour, including the
 * deliberately-preserved quirks (owner-only classroom management, admin override
 * only on classroom delete + puzzle-solution visibility).
 */

const ALL_ROLES: Role[] = ['admin', 'club_admin', 'coach', 'user'];

const u = (role: Role, over: Partial<PolicyUser> = {}): PolicyUser => ({
  id: 1,
  role,
  clubId: null,
  ...over,
});

describe('policy: can()', () => {
  describe('Classroom', () => {
    const subj = (over: Partial<{ isOwner: boolean; isMember: boolean; isActive: boolean }> = {}) =>
      ({ type: 'Classroom' as const, isOwner: false, isMember: false, isActive: true, ...over });

    it('create: everyone except plain users', () => {
      expect(can(u('admin'), 'create', subj())).toBe(true);
      expect(can(u('club_admin'), 'create', subj())).toBe(true);
      expect(can(u('coach'), 'create', subj())).toBe(true);
      expect(can(u('user'), 'create', subj())).toBe(false);
    });

    it('view: owner or member, role-independent', () => {
      for (const role of ALL_ROLES) {
        expect(can(u(role), 'view', subj({ isOwner: true }))).toBe(true);
        expect(can(u(role), 'view', subj({ isMember: true }))).toBe(true);
        expect(can(u(role), 'view', subj())).toBe(false);
      }
    });

    it('manage: strictly owner-only — NO admin/club_admin override', () => {
      for (const role of ALL_ROLES) {
        expect(can(u(role), 'manage', subj({ isOwner: true }))).toBe(true);
      }
      // Non-owners are denied regardless of role — the preserved quirk.
      expect(can(u('admin'), 'manage', subj({ isOwner: false }))).toBe(false);
      expect(can(u('club_admin'), 'manage', subj({ isOwner: false }))).toBe(false);
      expect(can(u('coach'), 'manage', subj({ isOwner: false }))).toBe(false);
      expect(can(u('user'), 'manage', subj({ isOwner: false }))).toBe(false);
    });

    it('delete: owner, or admin override', () => {
      for (const role of ALL_ROLES) {
        expect(can(u(role), 'delete', subj({ isOwner: true }))).toBe(true);
      }
      expect(can(u('admin'), 'delete', subj({ isOwner: false }))).toBe(true);
      expect(can(u('club_admin'), 'delete', subj({ isOwner: false }))).toBe(false);
      expect(can(u('coach'), 'delete', subj({ isOwner: false }))).toBe(false);
      expect(can(u('user'), 'delete', subj({ isOwner: false }))).toBe(false);
    });
  });

  describe('ClassroomPuzzle viewSolution', () => {
    const subj = (isOwner: boolean) => ({ type: 'ClassroomPuzzle' as const, isOwner });

    it('owner always sees the solution', () => {
      for (const role of ALL_ROLES) {
        expect(can(u(role), 'viewSolution', subj(true))).toBe(true);
      }
    });

    it('non-owner: privileged roles yes, students no', () => {
      expect(can(u('admin'), 'viewSolution', subj(false))).toBe(true);
      expect(can(u('club_admin'), 'viewSolution', subj(false))).toBe(true);
      expect(can(u('coach'), 'viewSolution', subj(false))).toBe(true);
      expect(can(u('user'), 'viewSolution', subj(false))).toBe(false);
    });
  });

  describe('Location', () => {
    const subj = (
      over: Partial<{ locationRole: 'owner' | 'coach' | null; sameClub: boolean }> = {},
    ) => ({ type: 'Location' as const, locationRole: null, sameClub: false, ...over });

    it('create: club_admin and admin only', () => {
      expect(can(u('admin'), 'create', subj())).toBe(true);
      expect(can(u('club_admin'), 'create', subj())).toBe(true);
      expect(can(u('coach'), 'create', subj())).toBe(false);
      expect(can(u('user'), 'create', subj())).toBe(false);
    });

    it('view: admin always; assigned coach or same-club otherwise', () => {
      expect(can(u('admin'), 'view', subj())).toBe(true);
      expect(can(u('coach'), 'view', subj({ locationRole: 'coach' }))).toBe(true);
      expect(can(u('user'), 'view', subj({ sameClub: true }))).toBe(true);
      expect(can(u('coach'), 'view', subj())).toBe(false);
      expect(can(u('user'), 'view', subj())).toBe(false);
    });

    it('manage: admin or location owner only', () => {
      expect(can(u('admin'), 'manage', subj())).toBe(true);
      expect(can(u('coach'), 'manage', subj({ locationRole: 'owner' }))).toBe(true);
      expect(can(u('coach'), 'manage', subj({ locationRole: 'coach' }))).toBe(false);
      expect(can(u('club_admin'), 'manage', subj({ sameClub: true }))).toBe(false);
      expect(can(u('user'), 'manage', subj({ locationRole: 'owner' }))).toBe(true);
    });

    it('moderate: admin or any assigned coach', () => {
      expect(can(u('admin'), 'moderate', subj())).toBe(true);
      expect(can(u('coach'), 'moderate', subj({ locationRole: 'coach' }))).toBe(true);
      expect(can(u('coach'), 'moderate', subj({ locationRole: 'owner' }))).toBe(true);
      expect(can(u('coach'), 'moderate', subj())).toBe(false);
      expect(can(u('user'), 'moderate', subj({ sameClub: true }))).toBe(false);
    });
  });

  describe('LocationNotice', () => {
    const subj = (
      over: Partial<{
        locationRole: 'owner' | 'coach' | null;
        sameClub: boolean;
        isAuthor: boolean;
        isMemberAtLocation: boolean;
      }> = {},
    ) => ({
      type: 'LocationNotice' as const,
      locationRole: null,
      sameClub: false,
      isAuthor: false,
      isMemberAtLocation: false,
      ...over,
    });

    it('viewBoard: admin, assigned coach, or classroom member', () => {
      expect(can(u('admin'), 'viewBoard', subj())).toBe(true);
      expect(can(u('coach'), 'viewBoard', subj({ locationRole: 'coach' }))).toBe(true);
      expect(can(u('user'), 'viewBoard', subj({ isMemberAtLocation: true }))).toBe(true);
      expect(can(u('user'), 'viewBoard', subj())).toBe(false);
    });

    it('create: admin, or same-club coach/club_admin', () => {
      expect(can(u('admin'), 'create', subj())).toBe(true);
      expect(can(u('coach'), 'create', subj({ sameClub: true }))).toBe(true);
      expect(can(u('club_admin'), 'create', subj({ sameClub: true }))).toBe(true);
      expect(can(u('user'), 'create', subj({ sameClub: true }))).toBe(false);
      expect(can(u('coach'), 'create', subj({ sameClub: false }))).toBe(false);
    });

    it('edit/delete: admin, assigned coach, or author', () => {
      for (const action of ['edit', 'delete'] as const) {
        expect(can(u('admin'), action, subj())).toBe(true);
        expect(can(u('coach'), action, subj({ locationRole: 'coach' }))).toBe(true);
        expect(can(u('user'), action, subj({ isAuthor: true }))).toBe(true);
        expect(can(u('user'), action, subj())).toBe(false);
      }
    });

    it('moderate: admin or any assigned coach', () => {
      expect(can(u('admin'), 'moderate', subj())).toBe(true);
      expect(can(u('coach'), 'moderate', subj({ locationRole: 'coach' }))).toBe(true);
      expect(can(u('user'), 'moderate', subj({ isAuthor: true }))).toBe(false);
    });
  });

  describe('Lesson library', () => {
    const subj = (isAuthor: boolean) => ({ type: 'Lesson' as const, isAuthor });

    it('view/create: privileged roles only', () => {
      for (const action of ['view', 'create'] as const) {
        expect(can(u('admin'), action, subj(false))).toBe(true);
        expect(can(u('club_admin'), action, subj(false))).toBe(true);
        expect(can(u('coach'), action, subj(false))).toBe(true);
        expect(can(u('user'), action, subj(false))).toBe(false);
      }
    });

    it('manage/setStatus: admin or author', () => {
      for (const action of ['manage', 'setStatus'] as const) {
        expect(can(u('admin'), action, subj(false))).toBe(true);
        expect(can(u('coach'), action, subj(true))).toBe(true);
        expect(can(u('coach'), action, subj(false))).toBe(false);
      }
    });

    it('delete/reorder: admin only', () => {
      for (const action of ['delete', 'reorder'] as const) {
        expect(can(u('admin'), action, subj(true))).toBe(true);
        expect(can(u('coach'), action, subj(true))).toBe(false);
        expect(can(u('club_admin'), action, subj(true))).toBe(false);
      }
    });
  });

  describe('Member / Club', () => {
    it('manageClubCoaches: admin, or club_admin within their club', () => {
      expect(can(u('admin'), 'manageClubCoaches', { type: 'Member', sameClub: false })).toBe(true);
      expect(can(u('club_admin'), 'manageClubCoaches', { type: 'Member', sameClub: true })).toBe(true);
      expect(can(u('club_admin'), 'manageClubCoaches', { type: 'Member', sameClub: false })).toBe(false);
      expect(can(u('coach'), 'manageClubCoaches', { type: 'Member', sameClub: true })).toBe(false);
      expect(can(u('user'), 'manageClubCoaches', { type: 'Member', sameClub: true })).toBe(false);
    });

    it('club manage: admin only', () => {
      expect(can(u('admin'), 'manage', { type: 'Club' })).toBe(true);
      expect(can(u('club_admin'), 'manage', { type: 'Club' })).toBe(false);
      expect(can(u('coach'), 'manage', { type: 'Club' })).toBe(false);
      expect(can(u('user'), 'manage', { type: 'Club' })).toBe(false);
    });
  });
});
