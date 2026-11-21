import type { HideableNavigationItem } from '@camp-registration/common/settings';

interface EventNavigationItemBase {
  icon: string;
  routeName: string;
  separated?: boolean;
}

export type EventNavigationItemDef = EventNavigationItemBase &
  (
    | { name: HideableNavigationItem; hideable: true }
    | { name: string; hideable?: false }
  );

/**
 * The event management nav rail, and the source of which of its items an event
 * can hide (`hideable: true`) via `SETTING_KEYS.NAVIGATION`. Kept as a single
 * list so a new rail item and its hideability are one edit, not two lists to
 * keep in sync — `EventManagementLayout.vue` and `NavigationSettingsPage.vue`
 * both read from this. Access comes from the route's `meta.eventPermission`.
 */
export const EVENT_NAVIGATION_ITEMS: EventNavigationItemDef[] = [
  {
    name: 'dashboard',
    icon: 'dashboard',
    routeName: 'management.event.dashboard',
  },
  {
    name: 'participants',
    icon: 'groups',
    routeName: 'management.event.participants',
  },
  {
    name: 'contact',
    icon: 'send',
    routeName: 'management.event.contact',
    hideable: true,
  },
  {
    name: 'program_planner',
    icon: 'event',
    routeName: 'management.event.program-planner',
    hideable: true,
  },
  {
    name: 'room_planner',
    icon: 'single_bed',
    routeName: 'management.event.room-planner',
    hideable: true,
  },
  {
    name: 'tasks',
    icon: 'task_alt',
    routeName: 'management.event.tasks',
    hideable: true,
  },
  {
    name: 'chore_planner',
    icon: 'checklist',
    routeName: 'management.event.chore-planner',
    hideable: true,
  },
  {
    name: 'finances',
    icon: 'receipt_long',
    routeName: 'management.event.finances',
    hideable: true,
  },
  {
    name: 'settings',
    icon: 'settings',
    routeName: 'management.event.settings',
    separated: true,
  },
];
