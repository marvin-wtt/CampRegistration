<template>
  <general-layout
    :navigation-items="navigationItems"
    :title="title"
    :loading="permissionsLoading"
  >
    <template #toolbar>
      <workspace-switcher />
    </template>

    <template #navigation>
      <workspace-switcher rail />
    </template>

    <template #default="{ component }">
      <component
        :is="component"
        :key="eventKey"
      />
    </template>
  </general-layout>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import WorkspaceSwitcher from '@/components/layout/WorkspaceSwitcher.vue';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useAssignedEventsStore } from '@/stores/assigned-events-store';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth-store';
import { useProfileStore } from '@/stores/profile-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import type { NavigationItemProps } from '@/components/NavigationItemProps.ts';
import { usePermissions } from '@/composables/permissions';
import { useRealtimeStore } from '@/stores/realtime-store';
import GeneralLayout from '@/components/layout/GeneralLayout.vue';
import { EVENT_NAVIGATION_ITEMS } from '@/config/eventNavigationItems';
import { provideNavigationSettings } from '@/composables/eventNavigationSettings';

const route = useRoute();
const { t } = useI18n();
const { to } = useObjectTranslation();
const { canAccess } = usePermissions();

const authStore = useAuthStore();
const profileStore = useProfileStore();
const eventDetailStore = useEventDetailsStore();
const assignedEventsStore = useAssignedEventsStore();
const realtimeStore = useRealtimeStore();

onMounted(async () => {
  await authStore.init();
  realtimeStore.connect();

  if (route.params.eventId) {
    await eventDetailStore.fetchData();
    void assignedEventsStore.fetchData();
  }
});

// Drives the router-view :key — changes only when the active event changes, so
// pages remount (and refetch) on event switch but not on intra-event navigation.
const eventKey = computed<string | undefined>(() => {
  const eventId = route.params.eventId;
  return Array.isArray(eventId) ? eventId[0] : eventId;
});

const title = computed<string>(() => {
  return eventName.value ?? t('title');
});

const eventName = computed<string | undefined>(() => {
  const name = eventDetailStore.data?.name;

  return name ? to(name) : undefined;
});

const items = computed<NavigationItemProps<'event'>[]>(() =>
  EVENT_NAVIGATION_ITEMS.map((def) => ({
    name: def.name,
    label: t(def.name),
    icon: def.icon,
    permission: def.permission,
    to: { name: def.routeName },
    separated: def.separated,
    hideable: def.hideable,
  })),
);

const { settings: navigationSettings } = provideNavigationSettings();

// Permission checks key off the loaded profile (eventAccess) and the active
// event id. Until both have resolved, `can()` returns false for everything, so
// show skeleton nav items rather than a misleadingly empty rail.
const permissionsLoading = computed<boolean>(() => {
  return (
    profileStore.user === undefined ||
    (route.params.eventId !== undefined && eventDetailStore.data === undefined)
  );
});

// The event sections all address a specific event, so the index has none — it
// falls back to the floating switcher rather than showing links that could not
// resolve without a eventId.
const navigationItems = computed<NavigationItemProps<'event'>[]>(() => {
  if (!route.params.eventId) {
    return [];
  }

  const visible = permissionsLoading.value
    ? items.value
    : filterItems(items.value);

  return visible.filter(
    (item) =>
      !item.hideable || !navigationSettings.hiddenItems.includes(item.name),
  );
});

function filterItems(
  navItems: NavigationItemProps<'event'>[],
): NavigationItemProps<'event'>[] {
  return navItems
    .filter((item) => canAccess(item.permission))
    .map((item) => {
      if ('children' in item && item.children !== undefined) {
        return {
          ...item,
          children: filterItems(item.children),
        };
      }
      return item;
    });
}
</script>

<i18n lang="yaml" locale="en">
contact: 'Contact'
dashboard: 'Dashboard'
participants: 'Participants'
program_planner: 'Program'
room_planner: 'Room Planner'
settings: 'Settings'
statistics: 'Statistics'
tasks: 'Tasks'
chore_planner: 'Duty Roster'
title: 'Event Management'
</i18n>

<i18n lang="yaml" locale="de">
contact: 'Kontaktieren'
dashboard: 'Dashboard'
participants: 'Teilnehmende'
program_planner: 'Programm'
room_planner: 'Raumplaner'
settings: 'Einstellungen'
statistics: 'Statistiken'
tasks: 'Aufgaben'
chore_planner: 'Dienstplan'
title: 'Veranstaltungsverwaltung'
</i18n>

<i18n lang="yaml" locale="fr">
contact: 'Contacter'
dashboard: 'Dashboard'
participants: 'Participants'
program_planner: 'Programme'
room_planner: 'Aménageur'
settings: 'Paramètres'
statistics: 'Statistiques'
tasks: 'Tâches'
chore_planner: 'Plan des corvées'
title: "Gestion de l'événement"
</i18n>

<i18n lang="yaml" locale="pl">
contact: 'Kontakt'
dashboard: 'Panel główny'
participants: 'Uczestnicy'
program_planner: 'Program'
room_planner: 'Plan pokoi'
settings: 'Ustawienia'
statistics: 'Statystyki'
tasks: 'Zadania'
chore_planner: 'Grafik dyżurów'
title: 'Zarządzanie wydarzeniem'
</i18n>

<i18n lang="yaml" locale="cs">
contact: 'Kontakt'
dashboard: 'Přehled'
participants: 'Účastníci'
program_planner: 'Program'
room_planner: 'Plán pokojů'
settings: 'Nastavení'
statistics: 'Statistiky'
tasks: 'Úkoly'
chore_planner: 'Rozpis služeb'
title: 'Správa akce'
</i18n>

<style>
/* width */
::-webkit-scrollbar {
  width: 0.5rem;
  height: 0.5rem;
}

/*noinspection CssUnusedSymbol*/
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}

/*noinspection CssUnusedSymbol*/
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Scrollbar */
/* Track */
::-webkit-scrollbar-track {
  box-shadow: inset 0 0 0.125rem grey;
  border-radius: 0.25rem;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #656565;
  border-radius: 0.25rem;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #4b4b4b;
}

::-webkit-scrollbar-corner {
}

/* Hide number input arrows */
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type='number'] {
  -moz-appearance: textfield;
}
</style>

