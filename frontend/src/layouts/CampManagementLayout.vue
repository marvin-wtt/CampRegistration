<template>
  <q-layout view="hHh Lpr lff">
    <q-ajax-bar color="accent" />

    <q-header
      class="bg-primary text-white"
      elevated
    >
      <q-toolbar>
        <q-btn
          v-if="showDrawer"
          dense
          flat
          icon="menu"
          round
          @click="drawer = !drawer"
        />
        <q-toolbar-title>
          <q-skeleton
            v-if="campDetailStore.isLoading"
            type="text"
          />
          <router-link
            v-else
            to="/"
            style="text-decoration: none; color: inherit"
          >
            {{ to(title) }}
          </router-link>
        </q-toolbar-title>

        <header-navigation :administration="administrator" />

        <locale-switch
          borderless
          class="q-px-md gt-xs"
          dense
          rounded
        />

        <profile-menu
          :profile="user"
          @logout="logout()"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-if="showDrawer"
      v-model="drawer"
      :breakpoint="599.99"
      :class="quasar.dark.isActive ? 'bg-grey-10' : 'bg-grey-4'"
      :mini="miniState"
      :width="220"
      bordered
      mini-to-overlay
      show-if-above
      @mouseout="miniState = true"
      @mouseover="miniState = false"
    >
      <q-list padding>
        <template
          v-for="item in filteredItems"
          :key="item.name"
        >
          <navigation-item
            v-if="item.header"
            :header="item.header"
            :name="item.name"
            :label="item.label"
            :separated="item.separated"
            :preview="item.preview"
          />
          <navigation-item
            v-else
            :name="item.name"
            :label="item.label"
            :icon="item.icon"
            :to="item.to"
            :separated="item.separated"
            :preview="item.preview"
            :children="item.children"
          />
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="fade">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import NavigationItem from 'components/NavigationItem.vue';
import LocaleSwitch from 'components/common/localization/LocaleSwitch.vue';
import ProfileMenu from 'components/common/ProfileMenu.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useMeta, useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { useAuthStore } from 'stores/auth-store';
import { useProfileStore } from 'stores/profile-store';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { storeToRefs } from 'pinia';
import HeaderNavigation from 'components/layout/HeaderNavigation.vue';
import type { NavigationItemProps } from 'components/NavigationItemProps.ts';

const quasar = useQuasar();
const route = useRoute();
const { t } = useI18n();
const { to } = useObjectTranslation();

const authStore = useAuthStore();
const profileStore = useProfileStore();
const campDetailStore = useCampDetailsStore();

const { user } = storeToRefs(profileStore);

async function init() {
  if (!user.value) {
    // Fetch user instead of init to force redirect on error
    await profileStore.fetchProfile();
  }
  if (route.params.camp) {
    await campDetailStore.fetchData();
  }
}
init();

const showDrawer = computed<boolean>(() => {
  return !('hideDrawer' in route.meta) || route.meta.hideDrawer !== true;
});

const title = computed(() => {
  return showDrawer.value ? campDetailStore.data?.name : t('app_name');
});

const administrator = computed<boolean>(() => {
  return profileStore.user?.role === 'ADMIN';
});

useMeta(() => {
  return {
    title: to(title.value),
    titleTemplate: (title) => `${title} | ${t('app_name')}`,
  };
});

const drawer = ref<boolean>(false);
const miniState = ref<boolean>(true);

const items: NavigationItemProps[] = [
  {
    name: 'participants',
    label: t('participants'),
    icon: 'groups',
    to: { name: 'participants' },
  },
  {
    name: 'contact',
    preview: true,
    label: t('contact'),
    icon: 'email',
    to: undefined,
  },
  {
    name: 'room_planner',
    label: t('room_planner'),
    icon: 'single_bed',
    to: { name: 'room-planner' },
  },
  {
    name: 'tools',
    preview: true,
    label: t('tools'),
    icon: 'menu',
    to: { name: 'tools' },
  },
  {
    name: 'settings',
    label: t('settings'),
    icon: 'settings',
    to: { name: 'management.settings' },
    separated: true,
    children: [
      {
        name: 'edit',
        label: t('edit'),
        icon: 'edit',
        to: { name: 'edit-camp' },
      },
      {
        name: 'files',
        label: t('files'),
        icon: 'folder',
        to: { name: 'edit-files' },
      },
      {
        name: 'form',
        label: t('form'),
        icon: 'feed',
        to: { name: 'edit-form' },
      },
      {
        name: 'access',
        label: t('access'),
        icon: 'key',
        to: { name: 'access' },
      },
    ],
  },
];

const filteredItems = computed<NavigationItemProps[]>(() => {
  if (dev.value) {
    return items;
  }

  return items.filter((item) => {
    return !item.preview;
  });
});

const dev = computed<boolean>(() => {
  return process.env.NODE_ENV === 'development';
});

function logout() {
  authStore.logout();
}
</script>

<i18n lang="yaml" locale="en">
access: 'Access'
contact: 'Contact'
dashboard: 'Dashboard'
edit: 'Edit'
files: 'Files'
form: 'Registration Form'
expenses: 'Expenses'
participants: 'Participants'
program_planner: 'Program'
room_planner: 'Room Planner'
settings: 'Settings'
statistics: 'Statistics'
tools: 'Tools'
notifications: 'Notifications'
</i18n>

<i18n lang="yaml" locale="de">
access: 'Zugriff'
contact: 'Kontaktieren'
dashboard: 'Dashboard'
edit: 'Bearbeiten'
files: 'Dateien'
expenses: 'Ausgaben'
form: 'Anmeldeformular'
participants: 'Teilnehmende'
program_planner: 'Programm'
room_planner: 'Raumplaner'
settings: 'Einstellungen'
statistics: 'Statistiken'
tools: 'Tools'
notifications: 'Benachrichtigungen'
</i18n>

<i18n lang="yaml" locale="fr">
access: 'Accès'
contact: 'Contacter'
dashboard: 'Dashboard'
edit: 'Modifier'
files: 'Fichiers'
expenses: 'Dépenses'
form: "formulaire d'inscription"
participants: 'Participants'
program_planner: 'Programme'
room_planner: 'Aménageur'
settings: 'Paramètres'
statistics: 'Statistiques'
tools: 'Tools'
notifications: 'Notifications'
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
