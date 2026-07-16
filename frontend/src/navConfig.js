/**
 * navConfig.js
 *
 * Defines the full navigation item list and a helper that returns the
 * role-filtered subset for a given user role.
 *
 * navItem shape: { label: string, route: string }
 * (icon can be added later once MUI icon imports are decided)
 */

/** All possible nav items in display order */
const ALL_NAV_ITEMS = [
  { label: 'Dashboard', route: '/dashboard' },
  { label: 'Minimart', route: '/dashboard/minimart' },
  { label: 'Complaint & Feedback Management', route: '/dashboard/complaint' },
  { label: 'Dormitory', route: '/dashboard/dormitory' },
  { label: 'Laundry', route: '/dashboard/laundry' },
  { label: 'Water Station', route: '/dashboard/water-station' },
  { label: 'Transaction Logs', route: '/dashboard/logs' },
];

/**
 * Routes visible per role (based on the UI Sidebar Navigation Matrix in the
 * design document).
 *
 * admin   — Dashboard, Minimart, Complaint, Dormitory, Laundry, Water Station
 * staff   — Minimart, Complaint, Dormitory, Laundry, Water Station
 * student — Complaint, Dormitory, Laundry, Water Station
 */
const ROLE_ROUTES = {
  admin: [
    '/dashboard',
    '/dashboard/minimart',
    '/dashboard/complaint',
    '/dashboard/dormitory',
    '/dashboard/laundry',
    '/dashboard/water-station',
    '/dashboard/logs',
  ],
  staff: [
    '/dashboard/minimart',
    '/dashboard/complaint',
    '/dashboard/dormitory',
    '/dashboard/laundry',
    '/dashboard/water-station',
    '/dashboard/logs',
  ],
  student: [
    '/dashboard/complaint',
    '/dashboard/dormitory',
    '/dashboard/laundry',
    '/dashboard/water-station',
  ],
};

/**
 * Returns the nav items allowed for the given role.
 * Falls back to an empty array for unknown roles.
 *
 * @param {string} role - 'admin' | 'staff' | 'student'
 * @returns {{ label: string, route: string }[]}
 */
export function getNavItemsForRole(role) {
  const allowedRoutes = ROLE_ROUTES[role] ?? [];
  return ALL_NAV_ITEMS.filter((item) => allowedRoutes.includes(item.route));
}

export default ALL_NAV_ITEMS;
