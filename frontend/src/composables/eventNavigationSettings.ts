import { inject, provide, type InjectionKey, type Ref } from 'vue';
import { useEventSettings } from '@/composables/eventSettings';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import type { NavigationSettings } from '@camp-registration/common/settings';

interface NavigationSettingsHandle {
  settings: NavigationSettings;
  isLoading: Ref<boolean>;
}

const NAVIGATION_SETTINGS_KEY: InjectionKey<NavigationSettingsHandle> = Symbol(
  'navigation-settings',
);

/**
 * Called once, by `EventManagementLayout.vue` (the rail's owner), so the rail
 * and any descendant page that toggles visibility (`NavigationSettingsPage.vue`)
 * share the same reactive `useEventSettings` instance. Sharing one instance
 * matters here: the realtime bus suppresses a client's own writes as echoes
 * (`frontend/src/stores/realtime-store.ts`, `event.origin === clientId`), so a
 * second independent `useEventSettings` call in the same tab would never learn
 * about a change made through the first one — it would wait for a page reload.
 */
export function provideNavigationSettings(): NavigationSettingsHandle {
  const handle = useEventSettings<NavigationSettings>(SETTING_KEYS.NAVIGATION, {
    hiddenItems: [],
  });
  provide(NAVIGATION_SETTINGS_KEY, handle);
  return handle;
}

/** Called by any descendant of `EventManagementLayout.vue` that reads or toggles visibility. */
export function useNavigationSettings(): NavigationSettingsHandle {
  const handle = inject(NAVIGATION_SETTINGS_KEY);
  if (!handle) {
    throw new Error(
      'useNavigationSettings() must be used within EventManagementLayout',
    );
  }

  return handle;
}
