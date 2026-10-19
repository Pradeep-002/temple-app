export type UserRole = 'SUPER_ADMIN' | 'SANGAM_ADMIN' | 'COLLECTOR' | 'MEMBER';

export type AppPermission =
  | 'VIEW_DASHBOARD'
  | 'VIEW_MEMBERS'
  | 'CREATE_MEMBER'
  | 'EDIT_MEMBER'
  | 'DELETE_MEMBER'
  | 'VIEW_COLLECTIONS'
  | 'COLLECT_PAYMENT'
  | 'MANAGE_CYCLES'
  | 'VIEW_DONATIONS'
  | 'CREATE_DONATION'
  | 'VIEW_EXPENSES'
  | 'CREATE_EXPENSE'
  | 'VIEW_EVENTS'
  | 'CREATE_EVENT'
  | 'ADD_EVENT_EXPENSE'
  | 'VIEW_LEDGER'
  | 'MANAGE_SETTINGS';

const ROLE_PERMISSIONS: Record<UserRole, AppPermission[]> = {
  SUPER_ADMIN: [
    'VIEW_DASHBOARD',
    'VIEW_MEMBERS',
    'CREATE_MEMBER',
    'EDIT_MEMBER',
    'DELETE_MEMBER',
    'VIEW_COLLECTIONS',
    'COLLECT_PAYMENT',
    'MANAGE_CYCLES',
    'VIEW_DONATIONS',
    'CREATE_DONATION',
    'VIEW_EXPENSES',
    'CREATE_EXPENSE',
    'VIEW_EVENTS',
    'CREATE_EVENT',
    'ADD_EVENT_EXPENSE',
    'VIEW_LEDGER',
    'MANAGE_SETTINGS'
  ],
  SANGAM_ADMIN: [
    'VIEW_DASHBOARD',
    'VIEW_MEMBERS',
    'CREATE_MEMBER',
    'EDIT_MEMBER',
    'VIEW_COLLECTIONS',
    'COLLECT_PAYMENT',
    'MANAGE_CYCLES',
    'VIEW_DONATIONS',
    'CREATE_DONATION',
    'VIEW_EXPENSES',
    'CREATE_EXPENSE',
    'VIEW_EVENTS',
    'CREATE_EVENT',
    'ADD_EVENT_EXPENSE',
    'VIEW_LEDGER',
    'MANAGE_SETTINGS'
  ],
  COLLECTOR: [
    'VIEW_DASHBOARD',
    'VIEW_MEMBERS',
    'VIEW_COLLECTIONS',
    'COLLECT_PAYMENT',
    'VIEW_DONATIONS',
    'CREATE_DONATION',
    'VIEW_EXPENSES',
    'VIEW_EVENTS'
  ],
  MEMBER: [
    'VIEW_DASHBOARD',
    'VIEW_COLLECTIONS',
    'VIEW_DONATIONS',
    'VIEW_EXPENSES',
    'VIEW_EVENTS'
  ]
};

export const hasPermission = (role: UserRole | string | undefined, permission: AppPermission): boolean => {
  if (!role) return false;
  const userRole = role as UserRole;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};

export const canAccessScreen = (role: UserRole | string | undefined, screenName: string): boolean => {
  if (!role) return false;
  const userRole = role as UserRole;

  switch (screenName) {
    case 'ADMIN_DASHBOARD':
      return userRole === 'SANGAM_ADMIN' || userRole === 'SUPER_ADMIN';
    case 'ADMIN_MEMBERS':
      return userRole === 'SANGAM_ADMIN' || userRole === 'SUPER_ADMIN';
    case 'ADMIN_COLLECTIONS':
      return userRole === 'SANGAM_ADMIN' || userRole === 'SUPER_ADMIN';
    case 'ADMIN_DONATIONS':
      return userRole === 'SANGAM_ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'COLLECTOR';
    case 'ADMIN_EXPENSES':
      return userRole === 'SANGAM_ADMIN' || userRole === 'SUPER_ADMIN';
    case 'ADMIN_EVENTS':
      return userRole === 'SANGAM_ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'COLLECTOR';
    case 'ADMIN_LEDGER':
      return userRole === 'SANGAM_ADMIN' || userRole === 'SUPER_ADMIN';
    case 'ADMIN_SETTINGS':
      return userRole === 'SANGAM_ADMIN';
    case 'COLLECTOR_DASHBOARD':
      return userRole === 'COLLECTOR' || userRole === 'SANGAM_ADMIN' || userRole === 'SUPER_ADMIN';
    case 'MEMBER_DASHBOARD':
    case 'MEMBER_PAYMENTS':
    case 'MEMBER_PROFILE':
      return true; // accessible to member, profile also accessible to all
    default:
      return true;
  }
};

export const isSangamAdmin = (role?: string) => role === 'SANGAM_ADMIN' || role === 'SUPER_ADMIN';
export const isCollector = (role?: string) => role === 'COLLECTOR';
export const isMember = (role?: string) => role === 'MEMBER';
