<template>
  <q-layout view="hHh Lpr lff">
    <q-ajax-bar color="accent" />

    <q-header bordered>
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
          <router-link
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
          unelevated
        />

        <profile-menu />
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
import { useMeta, useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { useProfileStore } from 'stores/profile-store';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import HeaderNavigation from 'components/layout/HeaderNavigation.vue';
import { useAuthStore } from 'stores/auth-store';
import type { NavigationItemProps } from 'components/NavigationItemProps.ts';

const quasar = useQuasar();
const route = useRoute();
const { t } = useI18n();
const { to } = useObjectTranslation();

const authStore = useAuthStore();
const profileStore = useProfileStore();

if (!profileStore.user) {
  authStore.init();
}

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
const miniState = ref<boolean>(true);

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
    name: 'settings',
    label: t('settings'),
    icon: 'settings',
    to: { name: 'administration.settings' },
    preview: true,
    separated: true,
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

const administrator = computed<boolean>(() => {
  return profileStore.user?.role === 'ADMIN';
});

const dev = computed<boolean>(() => {
  return process.env.NODE_ENV === 'development';
});
</script>

<i18n lang="yaml" locale="en">
title: 'Administration'

camps: 'Camps'
users: 'Users'
settings: 'Settings'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Verwaltung'

camps: 'Camps'
users: 'Benutzer'
settings: 'Einstellungen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Administration'

camps: 'Camps'
users: 'Utilisateurs'
settings: 'Paramètres'
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
