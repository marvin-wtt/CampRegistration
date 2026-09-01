import type { PermissionRequirement } from '@/composables/scopePermissions';

export interface EventNavigationItemDef {
  name: string;
  icon: string;
  routeName: string;
  permission?: PermissionRequirement<'event'>;
  separated?: boolean;
  // Can a camp hide this item from its own rail via the navigation setting?
  hideable?: boolean;
}

/**
 * The camp management nav rail, and the source of which of its items a camp
 * can hide (`hideable: true`) via `SETTING_KEYS.NAVIGATION`. Kept as a single
 * list so a new rail item and its hideability are one edit, not two lists to
 * keep in sync — `EventManagementLayout.vue` and `NavigationSettingsPage.vue`
 * both read from this.
 */
export const EVENT_NAVIGATION_ITEMS: EventNavigationItemDef[] = [
  {
    name: 'dashboard',
    icon: 'dashboard',
    permission: 'event.registrations.view',
    routeName: 'management.event.dashboard',
  },
  {
    name: 'participants',
    icon: 'groups',
    permission: 'event.registrations.view',
    routeName: 'management.event.participants',
  },
  {
    name: 'contact',
    icon: 'send',
    permission: { any: ['event.messages.create', 'event.messages.view'] },
    routeName: 'management.event.contact',
    hideable: true,
  },
  {
    name: 'program_planner',
    icon: 'event',
    permission: 'event.program_items.view',
    routeName: 'management.event.program-planner',
    hideable: true,
  },
  {
    name: 'room_planner',
    icon: 'single_bed',
    permission: 'event.rooms.view',
    routeName: 'management.event.room-planner',
    hideable: true,
  },
  {
    name: 'tasks',
    icon: 'task_alt',
    permission: 'event.tasks.view',
    routeName: 'management.event.tasks',
    hideable: true,
  },
  {
    name: 'chore_planner',
    icon: 'checklist',
    permission: 'event.chore_assignments.view',
    routeName: 'management.event.chore-planner',
    hideable: true,
  },
  {
    name: 'settings',
    icon: 'settings',
    routeName: 'management.event.settings',
    separated: true,
  },
];
