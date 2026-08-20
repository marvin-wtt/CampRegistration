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
        :key="campKey"
      />
    </template>
  </general-layout>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import WorkspaceSwitcher from '@/components/layout/WorkspaceSwitcher.vue';
import { useCampDetailsStore } from '@/stores/camp-details-store';
import { useAssignedCampsStore } from '@/stores/assigned-camps-store';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth-store';
import { useProfileStore } from '@/stores/profile-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import type { NavigationItemProps } from '@/components/NavigationItemProps.ts';
import { usePermissions } from '@/composables/permissions';
import { useRealtimeStore } from '@/stores/realtime-store';
import GeneralLayout from '@/components/layout/GeneralLayout.vue';

const route = useRoute();
const { t } = useI18n();
const { to } = useObjectTranslation();
const { canAccess } = usePermissions();

const authStore = useAuthStore();
const profileStore = useProfileStore();
const campDetailStore = useCampDetailsStore();
const assignedCampsStore = useAssignedCampsStore();
const realtimeStore = useRealtimeStore();

onMounted(async () => {
  await authStore.init();
  realtimeStore.connect();

  if (route.params.campId) {
    await campDetailStore.fetchData();
    void assignedCampsStore.fetchData();
  }
});

// Drives the router-view :key — changes only when the active camp changes, so
// pages remount (and refetch) on camp switch but not on intra-camp navigation.
const campKey = computed<string | undefined>(() => {
  const campId = route.params.campId;
  return Array.isArray(campId) ? campId[0] : campId;
});

const title = computed<string>(() => {
  return campName.value ?? t('title');
});

const campName = computed<string | undefined>(() => {
  const name = campDetailStore.data?.name;

  return name ? to(name) : undefined;
});

const items = computed<NavigationItemProps<'camp'>[]>(() => [
  {
    name: 'dashboard',
    label: t('dashboard'),
    icon: 'dashboard',
    permission: 'camp.registrations.view',
    to: { name: 'management.camp.dashboard' },
  },
  {
    name: 'participants',
    label: t('participants'),
    icon: 'groups',
    permission: 'camp.registrations.view',
    to: { name: 'management.camp.participants' },
  },
  {
    name: 'contact',
    label: t('contact'),
    icon: 'send',
    permission: { any: ['camp.messages.create', 'camp.messages.view'] },
    to: { name: 'management.camp.contact' },
  },
  {
    name: 'program_planner',
    label: t('program_planner'),
    icon: 'event',
    permission: 'camp.program_events.view',
    to: { name: 'management.camp.program-planner' },
  },
  {
    name: 'room_planner',
    label: t('room_planner'),
    icon: 'single_bed',
    permission: 'camp.rooms.view',
    to: { name: 'management.camp.room-planner' },
  },
  {
    name: 'tasks',
    label: t('tasks'),
    icon: 'task_alt',
    permission: 'camp.tasks.view',
    to: { name: 'management.camp.tasks' },
  },
  {
    name: 'settings',
    label: t('settings'),
    icon: 'settings',
    to: { name: 'management.camp.settings' },
    separated: true,
  },
]);

// Permission checks key off the loaded profile (campAccess) and the active
// camp id. Until both have resolved, `can()` returns false for everything, so
// show skeleton nav items rather than a misleadingly empty rail.
const permissionsLoading = computed<boolean>(() => {
  return (
    profileStore.user === undefined ||
    (route.params.campId !== undefined && campDetailStore.data === undefined)
  );
});

// The camp sections all address a specific camp, so the index has none — it
// falls back to the floating switcher rather than showing links that could not
// resolve without a campId.
const navigationItems = computed<NavigationItemProps<'camp'>[]>(() => {
  if (!route.params.campId) {
    return [];
  }

  return permissionsLoading.value ? items.value : filterItems(items.value);
});

function filterItems(
  navItems: NavigationItemProps<'camp'>[],
): NavigationItemProps<'camp'>[] {
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
title: 'Camp Management'
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
title: 'Camp-Verwaltung'
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
title: 'Gestion du camp'
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
title: 'Zarządzanie obozem'
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
title: 'Správa tábora'
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
