<template>
  <q-layout
    view="hHh Lpr lff"
    @scroll="onScroll"
  >
    <q-ajax-bar color="accent" />

    <!-- Top bar: only on mobile, where rails are hidden off-canvas. On large
         screens every page uses a left rail that carries the profile. -->
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
          @click="drawer = !drawer"
        />
        <q-toolbar-title>
          {{ to(title) }}
        </q-toolbar-title>

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
      <q-list class="q-list--rail">
        <template
          v-for="item in items"
          :key="item.name"
        >
          <navigation-item
            v-if="item.header"
            :header="item.header"
            :name="item.name"
            :label="item.label"
            :separated="item.separated"
          />
          <navigation-item
            v-else
            :name="item.name"
            :label="item.label"
            :icon="item.icon"
            :to="item.to"
            :separated="item.separated"
            :children="item.children"
          />
        </template>
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

    <!-- Admin home has no rail nav: use floating controls so the profile stays
         in the same bottom-left spot as every other large screen. -->
    <layout-floating-controls
      v-if="!showDrawer && quasar.screen.gt.xs"
      :back-to="{ name: 'management' }"
    />

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
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import NavigationItem from 'components/NavigationItem.vue';
import ProfileMenu from 'components/common/ProfileMenu.vue';
import LayoutFloatingControls from 'components/layout/LayoutFloatingControls.vue';
import { useMeta, useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { useAuthStore } from 'stores/auth-store';
import type { NavigationItemProps } from 'components/NavigationItemProps.ts';
import { MToolbar } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eToolbar';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const quasar = useQuasar();
const route = useRoute();
const { t } = useI18n();
const { to } = useObjectTranslation();

const authStore = useAuthStore();

onMounted(async () => {
  await authStore.init();
});

const showDrawer = computed<boolean>(() => {
  return !('hideDrawer' in route.meta) || route.meta.hideDrawer !== true;
});

const title = computed(() => {
  return t('title');
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

const items: NavigationItemProps[] = [
  {
    name: 'users',
    label: t('users'),
    icon: 'person',
    to: { name: 'administration.users' },
  },
  {
    name: 'camps',
    label: t('camps'),
    icon: 'home',
    to: { name: 'administration.camps' },
  },
  {
    name: 'newsletters',
    label: t('newsletters'),
    icon: 'mail',
    to: { name: 'administration.newsletters' },
  },
  {
    name: 'queues',
    label: t('queues'),
    icon: 'queue',
    to: { name: 'administration.queues' },
  },
];
</script>

<i18n lang="yaml" locale="en">
title: 'Administration'

camps: 'Camps'
newsletters: 'Newsletters'
queues: 'Queues'
users: 'Users'
settings: 'Settings'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Verwaltung'

camps: 'Camps'
newsletters: 'Newsletter'
queues: 'Warteschlangen'
users: 'Benutzer'
settings: 'Einstellungen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Administration'

camps: 'Camps'
newsletters: 'Newsletters'
queues: "Files d'attente"
users: 'Utilisateurs'
settings: 'Paramètres'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Administracja'

camps: 'Obozy'
newsletters: 'Newslettery'
queues: 'Kolejki'
users: 'Użytkownicy'
settings: 'Ustawienia'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Administrace'

camps: 'Tábory'
newsletters: 'Newslettery'
queues: 'Fronty'
users: 'Uživatelé'
settings: 'Nastavení'
</i18n>

<style>
/* width */
::-webkit-scrollbar {
  width: 0.5rem;
  height: 0.5rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}

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
</style>
