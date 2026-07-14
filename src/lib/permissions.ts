import { TabView, User, UserRole, ExcessBaggageAirline } from './types';

// Single source of truth for "which nav views can this user see." Before
// this, the same role-based logic was hand-duplicated across SideNav.tsx,
// BottomNav.tsx, EHIApp.tsx's ehi-nav allowlist, and More.tsx's menu
// gates -- four lists that had to be kept in sync by hand, and the only
// place a per-user override (view_overrides) could plug in without
// touching all four separately.

export interface ViewDef {
  id: TabView;
  label: string;
  roles: UserRole[];
}

// The static (non-airline-dependent) top-level views and which roles get
// each one by default. This is what a user falls back to when they have
// no view_overrides set -- i.e. every account until a super_admin
// explicitly customizes one.
export const STATIC_VIEWS: ViewDef[] = [
  { id: 'Tower', label: 'Dashboard', roles: ['super_admin', 'admin', 'cargo_agent', 'baggage_agent', 'marketing_agent', 'accountant', 'auditor'] },
  { id: 'Cargo', label: 'Cargo Entry', roles: ['super_admin', 'admin', 'cargo_agent', 'office_work'] },
  { id: 'Marketing', label: 'Marketing', roles: ['super_admin', 'admin', 'marketing_agent', 'office_work'] },
  { id: 'Packages', label: 'Package Desk', roles: ['super_admin', 'admin', 'cargo_agent', 'marketing_agent', 'office_work'] },
  { id: 'Scan', label: 'QR Scanner', roles: ['super_admin', 'admin', 'cargo_agent', 'baggage_agent', 'marketing_agent', 'accountant', 'auditor', 'driver', 'office_work'] },
  { id: 'Incoming', label: 'Incoming To Hub', roles: ['super_admin', 'admin', 'cargo_agent', 'baggage_agent', 'driver', 'office_work'] },
  { id: 'MyTrips', label: 'My Trips', roles: ['driver'] },
  { id: 'More', label: 'More', roles: ['super_admin', 'admin', 'accountant', 'auditor', 'cargo_agent', 'baggage_agent', 'marketing_agent', 'driver', 'office_work'] },
  { id: 'IT Debug', label: 'IT Debug Console', roles: ['super_admin'] },
  { id: 'Credit & Debit', label: 'Credit & Debit', roles: ['super_admin', 'admin', 'accountant'] },
];

// One synthetic view per active configured excess-baggage airline --
// baggage_agent gets only their assigned one, super_admin/admin get all
// (mirrors the SideNav.tsx BAGGAGE_MARKER expansion this replaces).
export function getBaggageViews(role: UserRole, assignedAirline: string | undefined, airlines: ExcessBaggageAirline[]): ViewDef[] {
  if (role === 'baggage_agent') {
    return assignedAirline ? [{ id: `Baggage:${assignedAirline}` as TabView, label: `${assignedAirline} POS`, roles: ['baggage_agent'] }] : [];
  }
  if (role === 'super_admin' || role === 'admin') {
    return airlines.map((a) => ({ id: `Baggage:${a.name}` as TabView, label: `${a.name} POS`, roles: [role] }));
  }
  return [];
}

// Every view that exists, for a given user's context -- used to render a
// "pick which views this person can see" checklist (StaffManagement's
// view-access editor), independent of what that user's role would
// normally default to.
export function getAllViewDefs(airlines: ExcessBaggageAirline[]): ViewDef[] {
  const allAirlineViews = airlines.map((a) => ({ id: `Baggage:${a.name}` as TabView, label: `${a.name} POS`, roles: ['super_admin', 'admin'] as UserRole[] }));
  return [...STATIC_VIEWS, ...allAirlineViews];
}

// The role-derived default view list -- what a user falls back to with no
// override set.
export function getRoleDefaultTabs(user: Pick<User, 'role' | 'assigned_airline'>, airlines: ExcessBaggageAirline[]): TabView[] {
  const staticIds = STATIC_VIEWS.filter((v) => v.roles.includes(user.role)).map((v) => v.id);
  const baggageIds = getBaggageViews(user.role, user.assigned_airline, airlines).map((v) => v.id);
  return [...staticIds, ...baggageIds];
}

// The actual, final list of views this user can access right now: their
// explicit override if a super_admin has set one (replaces the role
// default entirely -- not additive), otherwise the normal role-derived
// default. `null`/`undefined` means no override; an explicit `[]` is a
// deliberate "this person has no views" and is respected as-is (they can
// still sign out via the header/sidenav's sign-out control, which isn't
// gated by this list).
export function getAllowedTabs(user: Pick<User, 'role' | 'assigned_airline' | 'view_overrides'>, airlines: ExcessBaggageAirline[]): TabView[] {
  if (user.view_overrides != null) {
    return user.view_overrides as TabView[];
  }
  return getRoleDefaultTabs(user, airlines);
}

export function canAccessTab(user: Pick<User, 'role' | 'assigned_airline' | 'view_overrides'>, tab: string, airlines: ExcessBaggageAirline[]): boolean {
  return getAllowedTabs(user, airlines).includes(tab as TabView);
}
