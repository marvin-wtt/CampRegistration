<template>
  <q-layout view="hHh Lpr lff">
    <q-ajax-bar color="accent" />

    <q-header bordered>
      <q-toolbar>
        <q-toolbar-title>
          <router-link
            :to="{ name: 'management.newsletters' }"
            style="text-decoration: none; color: inherit"
          >
            {{ t('title') }}
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
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import LocaleSwitch from 'components/common/localization/LocaleSwitch.vue';
import ProfileMenu from 'components/common/ProfileMenu.vue';
import { useMeta } from 'quasar';
import { useAuthStore } from 'stores/auth-store';
import { useProfileStore } from 'stores/profile-store';
import HeaderNavigation from 'components/layout/HeaderNavigation.vue';

const { t } = useI18n();

const authStore = useAuthStore();
const profileStore = useProfileStore();

onMounted(async () => {
  await authStore.init();
});

const administrator = computed<boolean>(() => {
  return profileStore.user?.role === 'ADMIN';
});

useMeta(() => {
  return {
    title: t('title'),
    titleTemplate: (title) => `${title} | ${t('app_name')}`,
  };
});
</script>

<i18n lang="yaml" locale="en">
title: 'Newsletters'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Newsletter'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Newsletters'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Newslettery'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Newslettery'
</i18n>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
