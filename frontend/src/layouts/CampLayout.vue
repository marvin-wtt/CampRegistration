<template>
  <q-layout view="hHh Lpr fFf">
    <!-- Be sure to play with the Layout demo on docs -->

    <!-- (Optional) The Header -->
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          <router-link
            to="/"
            style="text-decoration: none; color: inherit"
          >
            {{ t('app_name') }}
          </router-link>
        </q-toolbar-title>

        <q-space />

        <header-navigation
          v-if="user"
          :administration="administrator"
        />

        <q-btn
          v-else
          :label="t('create')"
          :to="{ name: 'management' }"
          class="gt-sm"
          flat
          rounded
        />

        <language-switch
          borderless
          class="q-px-md"
          dense
          rounded
        />

        <profile-menu
          :profile="user"
          @logout="logout()"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="fade">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>

    <help-fab />
  </q-layout>
</template>

<script lang="ts" setup>
import LanguageSwitch from 'components/common/localization/LocaleSwitch.vue';
import { useI18n } from 'vue-i18n';
import { useMeta } from 'quasar';
import ProfileMenu from 'components/common/ProfileMenu.vue';
import HelpFab from 'components/FeedbackFab.vue';
import { useAuthStore } from 'stores/auth-store';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import HeaderNavigation from 'components/layout/HeaderNavigation.vue';

const { t } = useI18n();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

useMeta(() => {
  return {
    title: 'Camps',
    titleTemplate: (title) => `${title} | ${t('app_name')}`,
  };
});

if (!authStore.user) {
  authStore.init();
}

const administrator = computed<boolean>(() => {
  return authStore.user?.role === 'ADMIN';
});

function logout() {
  authStore.logout();
}
</script>

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

<i18n lang="yaml" locale="en">
camps: 'Camps'
create: 'Organize Camp'
</i18n>

<i18n lang="yaml" locale="de">
camps: 'Camps'
create: 'Camp organisieren'
</i18n>

<i18n lang="yaml" locale="fr">
camps: 'Camps'
create: 'Organiser un camp'
</i18n>
