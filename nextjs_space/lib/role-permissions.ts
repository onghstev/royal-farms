export type RoleName = 'Farm Manager' | 'Supervisor' | 'Farm Worker';

export const ROLE_PERMISSIONS = {
  'Farm Manager': {
    flocks: { view: true, create: true, edit: true, delete: true },
    batches: { view: true, create: true, edit: true, delete: true },
    eggCollection: { view: true, create: true, edit: true, delete: true },
    mortality: { view: true, create: true, edit: true, delete: true },
    feed: { view: true, create: true, edit: true, delete: true },
    users: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, export: true },
    alerts: { view: true, resolve: true },
  },
  'Supervisor': {
    flocks: { view: true, create: false, edit: true, delete: false },
    batches: { view: true, create: false, edit: true, delete: false },
    eggCollection: { view: true, create: true, edit: true, delete: false },
    mortality: { view: true, create: true, edit: true, delete: false },
    feed: { view: true, create: true, edit: true, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    reports: { view: true, export: false },
    alerts: { view: true, resolve: true },
  },
  'Farm Worker': {
    flocks: { view: true, create: false, edit: false, delete: false },
    batches: { view: true, create: false, edit: false, delete: false },
    eggCollection: { view: true, create: true, edit: false, delete: false },
    mortality: { view: true, create: true, edit: false, delete: false },
    feed: { view: true, create: true, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    reports: { view: false, export: false },
    alerts: { view: true, resolve: false },
  },
};

export function hasPermission(
  role: RoleName,
  resource: keyof typeof ROLE_PERMISSIONS['Farm Manager'],
  action: string
): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions || !permissions[resource]) return false;
  return (permissions[resource] as any)[action] === true;
}
