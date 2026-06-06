/**
 * Centralized authorization policy layer.
 *
 * `can(user, action, subject)` is the single source of truth for permission
 * decisions; guards wrap it with entity fetching + error mapping; context
 * helpers gather the relational facts decisions depend on.
 */

export * from './types';
export { can } from './can';
export * from './context';
export * from './guards';
