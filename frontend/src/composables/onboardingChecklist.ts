import { computed, watch, type ComputedRef, type Ref } from 'vue';
import {
  SETTING_KEYS,
  type HideableNavigationItem,
  type OnboardingSettings,
} from '@camp-registration/common/settings';
import type { ScopePermission } from '@camp-registration/common/permissions';
import type { EventPhase } from '@camp-registration/common/entities';
import { useEventSettings } from '@/composables/eventSettings';
import { useNavigationSettings } from '@/composables/eventNavigationSettings';
import { useEventRouteAccess, usePermissions } from '@/composables/permissions';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useEventFilesStore } from '@/stores/event-files-store';
import { useEventManagerStore } from '@/stores/event-manager-store';
import { useProgramPlannerStore } from '@/stores/program-planner-store';
import { useRoomStore } from '@/stores/room-store';
import { useChoreStore } from '@/stores/chore-store';

export type OnboardingGroup = 'registration' | 'event';

export type OnboardingStatus = 'open' | 'done' | 'skipped' | 'loading';

// Once registration is open, its setup steps are past.
const GROUP_PHASES: Record<OnboardingGroup, readonly EventPhase[]> = {
  registration: ['setup'],
  event: ['setup', 'registration', 'preparation'],
};

/**
 * `act` is what doing the step takes, beyond opening its page. Items with a
 * `detect` permission are detected; the others are checked by hand.
 */
interface OnboardingItemDefinition {
  key: string;
  group: OnboardingGroup;
  route: string;
  icon: string;
  act: ScopePermission<'event'>;
  navItem?: HideableNavigationItem;
  detect?: ScopePermission<'event'>;
}

export const ONBOARDING_ITEMS = [
  {
    key: 'tools',
    group: 'registration',
    route: 'management.event.settings.navigation',
    icon: 'tune',
    act: 'event.edit',
  },
  {
    key: 'team',
    group: 'registration',
    route: 'management.event.settings.access',
    icon: 'group_add',
    act: 'event.managers.create',
    detect: 'event.managers.view',
  },
  {
    key: 'form',
    group: 'registration',
    route: 'management.event.settings.form',
    icon: 'edit_note',
    act: 'event.edit',
  },
  {
    key: 'emails',
    group: 'registration',
    route: 'management.event.settings.emails',
    icon: 'forward_to_inbox',
    act: 'event.message_templates.edit',
  },
  {
    key: 'files',
    group: 'registration',
    route: 'management.event.settings.files',
    icon: 'upload_file',
    act: 'event.files.create',
    detect: 'event.files.view',
  },
  {
    key: 'privacy',
    group: 'registration',
    route: 'management.event.settings.privacy',
    icon: 'shield',
    act: 'event.edit',
  },
  {
    key: 'window',
    group: 'registration',
    route: 'management.event.settings.edit',
    icon: 'event_available',
    act: 'event.edit',
    detect: 'event.view',
  },
  {
    key: 'program',
    group: 'event',
    route: 'management.event.program-planner',
    icon: 'calendar_month',
    act: 'event.program_items.create',
    navItem: 'program_planner',
    detect: 'event.program_items.view',
  },
  {
    key: 'finances',
    group: 'event',
    route: 'management.event.finances',
    icon: 'payments',
    act: 'event.expenses.create',
    navItem: 'finances',
  },
  {
    key: 'rooms',
    group: 'event',
    route: 'management.event.room-planner',
    icon: 'bed',
    act: 'event.rooms.create',
    navItem: 'room_planner',
    detect: 'event.rooms.view',
  },
  {
    key: 'chores',
    group: 'event',
    route: 'management.event.chore-planner',
    icon: 'cleaning_services',
    act: 'event.chores.create',
    navItem: 'chore_planner',
    detect: 'event.chores.view',
  },
] as const satisfies readonly OnboardingItemDefinition[];

type ItemOf = (typeof ONBOARDING_ITEMS)[number];

export type OnboardingItemKey = ItemOf['key'];

type DetectedKey = Extract<ItemOf, { detect: string }>['key'];

export interface OnboardingItem {
  key: OnboardingItemKey;
  group: OnboardingGroup;
  route: string;
  icon: string;
  manual: boolean;
  status: OnboardingStatus;
  /** Belongs to the viewed phase; the others are only listed on request. */
  current: boolean;
}

export interface OnboardingContext {
  phase: EventPhase;
  settings: OnboardingSettings;
  /** `null` while the data deciding it loads. */
  detected: Record<DetectedKey, boolean | null>;
  hiddenTools: string[];
  canOpen: (route: string) => boolean;
  can: (permission: ScopePermission<'event'>) => boolean;
}

export const DEFAULT_ONBOARDING_SETTINGS: OnboardingSettings = {
  completed: [],
  skipped: [],
  hidden: false,
};

function isAvailable(
  item: OnboardingItemDefinition,
  context: OnboardingContext,
): boolean {
  return (
    context.canOpen(item.route) &&
    context.can(item.act) &&
    (item.detect === undefined || context.can(item.detect)) &&
    (item.navItem === undefined || !context.hiddenTools.includes(item.navItem))
  );
}

function detectionOf(
  item: ItemOf,
  detected: OnboardingContext['detected'],
): boolean | null | undefined {
  return 'detect' in item ? detected[item.key] : undefined;
}

/**
 * Leaves out steps the manager can't do or detect, and tools hidden from the
 * nav. Being done wins over being skipped; detected items can't be
 * completed by hand.
 */
export function resolveOnboardingItems(
  context: OnboardingContext,
): OnboardingItem[] {
  const { settings, detected } = context;

  return ONBOARDING_ITEMS.filter((item) => isAvailable(item, context)).map(
    (item) => {
      const detection = detectionOf(item, detected);
      const manual = detection === undefined;
      const done = manual
        ? settings.completed.includes(item.key)
        : detection === true;

      let status: OnboardingStatus = 'open';
      if (done) {
        status = 'done';
      } else if (settings.skipped.includes(item.key)) {
        status = 'skipped';
      } else if (detection === null) {
        status = 'loading';
      }

      return {
        key: item.key,
        group: item.group,
        route: item.route,
        icon: item.icon,
        manual,
        status,
        current: GROUP_PHASES[item.group].includes(context.phase),
      };
    },
  );
}

function without(list: string[], key: string): string[] {
  return list.filter((entry) => entry !== key);
}

function detectedBy<T>(
  store: { data: T[] | undefined; isLoading: boolean },
  isDone: (data: T[]) => boolean,
): boolean | null {
  return store.isLoading ? null : isDone(store.data ?? []);
}

/**
 * The checklist shared by the event's team. Data for detected items loads only
 * once the checklist is known not to be hidden, and only where the manager may
 * read it.
 */
export function useOnboardingChecklist(phase: Ref<EventPhase>): {
  settings: OnboardingSettings;
  isLoading: Ref<boolean>;
  items: ComputedRef<OnboardingItem[]>;
  check: (key: string) => void;
  skip: (key: string) => void;
  undo: (key: string) => void;
  hide: () => void;
} {
  const { can } = usePermissions();
  const { canAccessRoute } = useEventRouteAccess();
  const { settings: navigationSettings } = useNavigationSettings();
  const eventDetailsStore = useEventDetailsStore();
  const filesStore = useEventFilesStore();
  const managerStore = useEventManagerStore();
  const programStore = useProgramPlannerStore();
  const roomStore = useRoomStore();
  const choreStore = useChoreStore();

  const { settings, isLoading } = useEventSettings<OnboardingSettings>(
    SETTING_KEYS.ONBOARDING,
    { ...DEFAULT_ONBOARDING_SETTINGS },
  );

  const shown = computed<boolean>(() => !isLoading.value && !settings.hidden);

  function loadWhen(
    permission: ScopePermission<'event'>,
    fetch: () => unknown,
  ): void {
    watch(
      () => shown.value && can(permission),
      (ok) => {
        if (ok) {
          void fetch();
        }
      },
      { immediate: true },
    );
  }

  loadWhen('event.managers.view', () => managerStore.fetchData());
  loadWhen('event.files.view', () => filesStore.fetchData());
  loadWhen('event.program_items.view', () => programStore.fetchData());
  loadWhen('event.rooms.view', () => roomStore.fetchData());
  loadWhen('event.chores.view', () => choreStore.fetchData());

  const detected = computed<OnboardingContext['detected']>(() => {
    const event = eventDetailsStore.data;

    return {
      team: detectedBy(managerStore, (list) => list.length > 1),
      files: filesStore.isLoading ? null : filesStore.missingFilesCount === 0,
      window: event
        ? !!(event.registrationOpensAt || event.registrationClosesAt)
        : null,
      program: detectedBy(programStore, (list) => list.length > 0),
      rooms: detectedBy(roomStore, (list) => list.length > 0),
      chores: detectedBy(choreStore, (list) => list.length > 0),
    };
  });

  const items = computed<OnboardingItem[]>(() =>
    resolveOnboardingItems({
      phase: phase.value,
      settings,
      detected: detected.value,
      hiddenTools: navigationSettings.hiddenItems,
      canOpen: (route) => canAccessRoute(route),
      can: (permission) => can(permission),
    }),
  );

  function check(key: string): void {
    settings.completed = [...without(settings.completed, key), key];
    settings.skipped = without(settings.skipped, key);
  }

  function skip(key: string): void {
    settings.skipped = [...without(settings.skipped, key), key];
    settings.completed = without(settings.completed, key);
  }

  function undo(key: string): void {
    settings.completed = without(settings.completed, key);
    settings.skipped = without(settings.skipped, key);
  }

  function hide(): void {
    settings.hidden = true;
  }

  return { settings, isLoading, items, check, skip, undo, hide };
}
