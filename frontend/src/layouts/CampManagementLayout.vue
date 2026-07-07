<template>
  <q-layout
    view="hHh Lpr lFf"
    @scroll="onScroll"
  >
    <q-ajax-bar color="accent" />

    <!-- Top bar: mobile only. On large screens pages use either a left rail
         or floating controls, both of which carry the profile. -->
    <q-header
      v-if="quasar.screen.lt.sm"
      class="app-top-bar"
      :class="{ 'app-top-bar--scrolled': scrolled }"
    >
      <m-toolbar>
        <m-btn
          v-if="showDrawer"
          icon="menu"
          square
          round
          text
          @click="toggleDrawer"
        />
        <m-btn
          v-else-if="!isLanding"
          icon="arrow_back"
          square
          round
          text
          :aria-label="t('back')"
          @click="navigateHome()"
        />

        <!-- Camp context (mobile): name doubles as a camp switcher -->
        <camp-switcher v-if="showDrawer" />
        <q-space />

        <profile-menu />
      </m-toolbar>
    </q-header>

    <q-drawer
      v-if="showDrawer"
      v-model="drawer"
      :breakpoint="599.99"
      mini
      :width="300"
      :mini-width="96"
      bordered
      show-if-above
      class="column no-wrap"
    >
      <!-- Rail header: camp switcher (desktop only — mobile uses the top bar) -->
      <div
        v-if="quasar.screen.gt.xs"
        class="rail-header row justify-center q-py-sm"
      >
        <camp-switcher rail />
      </div>

      <q-separator
        v-if="quasar.screen.gt.xs"
        inset
      />

      <q-list class="q-list--rail">
        <template v-if="permissionsLoading">
          <navigation-item-skeleton
            v-for="(item, i) in items"
            :key="item.name"
            :label="item.label"
            :separated="item.separated"
            :first="i === 0"
          />
        </template>
        <navigation-item
          v-for="(item, i) in filteredItems"
          v-else
          :key="item.name"
          v-bind="item"
          :first="i === 0"
        />
      </q-list>

      <q-space />

      <!-- Rail footer: profile (desktop only — mobile uses the top bar) -->
      <div
        v-if="quasar.screen.gt.xs"
        class="rail-footer row justify-center q-py-sm"
      >
        <profile-menu />
      </div>
    </q-drawer>

    <!-- No-drawer pages on large screens (camps grid, landing) get floating
         controls instead of a rail, keeping the profile bottom-left. The
         landing is home, so it shows no back button. -->
    <layout-floating-controls
      v-if="!showDrawer && quasar.screen.gt.xs"
      :back-to="isLanding ? { name: 'camps' } : { name: 'management' }"
    />

    <q-page-container>
      <!-- Key by campId so switching camps remounts the page (re-running its
           onMounted data fetch). Without this, Vue reuses the component instance
           on param-only navigation and pages keep showing the previous camp's
           data. -->
      <router-view v-slot="{ Component }">
        <transition name="fade">
          <component
            :is="Component"
            :key="campKey"
          />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import NavigationItem from '@/components/NavigationItem.vue';
import NavigationItemSkeleton from '@/components/NavigationItemSkeleton.vue';
import ProfileMenu from '@/components/common/ProfileMenu.vue';
import CampSwitcher from '@/components/layout/CampSwitcher.vue';
import LayoutFloatingControls from '@/components/layout/LayoutFloatingControls.vue';
import { useCampDetailsStore } from '@/stores/camp-details-store';
import { useAssignedCampsStore } from '@/stores/assigned-camps-store';
import { useMeta, useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth-store';
import { useProfileStore } from '@/stores/profile-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import type { NavigationItemProps } from '@/components/NavigationItemProps.ts';
import { usePermissions } from '@/composables/permissions';
import { useRealtimeStore } from '@/stores/realtime-store';
import { MToolbar } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eToolbar';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const quasar = useQuasar();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { to } = useObjectTranslation();
const { canAccessAny } = usePermissions();

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

const showDrawer = computed<boolean>(() => {
  return !('hideDrawer' in route.meta) || route.meta.hideDrawer !== true;
});

// The landing/home hub keeps a full-width top bar instead of a rail.
const isLanding = computed<boolean>(() => {
  return route.name === 'management';
});

const title = computed(() => {
  return showDrawer.value ? campName.value : t('app_name');
});

const campName = computed<string | undefined>(() => {
  return to(campDetailStore.data?.name);
});

useMeta(() => {
  return {
    title: to(title.value),
    titleTemplate: (title) => `${title} | ${t('app_name')}`,
  };
});

const drawer = ref<boolean>(false);

// Top app bar elevates once content scrolls beneath it (MD3 small top app bar).
const scrolled = ref<boolean>(false);

function onScroll(info: { position: { top: number } | number }) {
  const top =
    typeof info.position === 'number' ? info.position : info.position.top;
  scrolled.value = top > 0;
}

const items = computed<NavigationItemProps[]>(() => [
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
    permission: ['camp.messages.create', 'camp.messages.view'],
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

const filteredItems = computed<NavigationItemProps[]>(() => {
  return filterItems(items.value);
});

function filterItems(navItems: NavigationItemProps[]): NavigationItemProps[] {
  return navItems
    .filter((item) => canAccessAny(item.permission))
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

function toggleDrawer() {
  drawer.value = !drawer.value;
}

function navigateHome() {
  if (route.name === 'management') {
    void router.push({ name: 'camps' });
    return;
  }

  if (route.name === 'management.camps') {
    void router.push({ name: 'management' });
    return;
  }

  void router.push({ name: 'management.camps' });
}
</script>

<i18n lang="yaml" locale="en">
back: 'Back'
contact: 'Contact'
dashboard: 'Dashboard'
participants: 'Participants'
program_planner: 'Program'
room_planner: 'Room Planner'
settings: 'Settings'
statistics: 'Statistics'
switch_camp: 'Switch camp'
tasks: 'Tasks'
</i18n>

<i18n lang="yaml" locale="de">
back: 'Zurück'
contact: 'Kontaktieren'
dashboard: 'Dashboard'
participants: 'Teilnehmende'
program_planner: 'Programm'
room_planner: 'Raumplaner'
settings: 'Einstellungen'
statistics: 'Statistiken'
switch_camp: 'Camp wechseln'
tasks: 'Aufgaben'
</i18n>

<i18n lang="yaml" locale="fr">
back: 'Retour'
contact: 'Contacter'
dashboard: 'Dashboard'
participants: 'Participants'
program_planner: 'Programme'
room_planner: 'Aménageur'
settings: 'Paramètres'
statistics: 'Statistiques'
switch_camp: 'Changer de camp'
tasks: 'Tâches'
</i18n>

<i18n lang="yaml" locale="pl">
back: 'Wstecz'
contact: 'Kontakt'
dashboard: 'Panel główny'
participants: 'Uczestnicy'
program_planner: 'Program'
room_planner: 'Plan pokoi'
settings: 'Ustawienia'
statistics: 'Statystyki'
switch_camp: 'Zmień obóz'
tasks: 'Zadania'
</i18n>

<i18n lang="yaml" locale="cs">
back: 'Zpět'
contact: 'Kontakt'
dashboard: 'Přehled'
participants: 'Účastníci'
program_planner: 'Program'
room_planner: 'Plán pokojů'
settings: 'Nastavení'
statistics: 'Statistiky'
switch_camp: 'Změnit tábor'
tasks: 'Úkoly'
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
