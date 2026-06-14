<template>
  <q-layout
    view="hHh Lpr lff"
    @scroll="onScroll"
  >
    <q-ajax-bar color="accent" />

    <!-- Top bar: only on mobile, where the rail is hidden. -->
    <q-header
      v-if="quasar.screen.lt.sm"
      class="app-top-bar"
      :class="{ 'app-top-bar--scrolled': scrolled }"
    >
      <m-toolbar>
        <m-btn
          icon="arrow_back"
          square
          round
          text
          :aria-label="t('back')"
          @click="navigateHome"
        />
        <q-toolbar-title>
          {{ t('title') }}
        </q-toolbar-title>

        <profile-menu />
      </m-toolbar>
    </q-header>

    <!-- Newsletters has no sub-navigation, so on large screens it uses floating
         controls (back + profile) instead of a rail, keeping the profile in the
         same bottom-left spot as every other layout. -->
    <layout-floating-controls
      v-if="quasar.screen.gt.xs"
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
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ProfileMenu from 'components/common/ProfileMenu.vue';
import LayoutFloatingControls from 'components/layout/LayoutFloatingControls.vue';
import { useMeta, useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth-store';
import { MToolbar } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eToolbar';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const quasar = useQuasar();
const router = useRouter();
const { t } = useI18n();

const authStore = useAuthStore();

onMounted(async () => {
  await authStore.init();
});

useMeta(() => {
  return {
    title: t('title'),
    titleTemplate: (title) => `${title} | ${t('app_name')}`,
  };
});

function navigateHome() {
  void router.push({ name: 'management' });
}

// Top app bar elevates once content scrolls beneath it (MD3 small top app bar).
const scrolled = ref<boolean>(false);

function onScroll(info: { position: { top: number } | number }) {
  const top =
    typeof info.position === 'number' ? info.position : info.position.top;
  scrolled.value = top > 0;
}
</script>

<i18n lang="yaml" locale="en">
title: 'Newsletters'
back: 'Back'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Newsletter'
back: 'Zurück'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Newsletters'
back: 'Retour'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Newslettery'
back: 'Wstecz'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Newslettery'
back: 'Zpět'
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

::-webkit-scrollbar {
  width: 0.5rem;
  height: 0.5rem;
}

::-webkit-scrollbar-track {
  box-shadow: inset 0 0 0.125rem grey;
  border-radius: 0.25rem;
}

::-webkit-scrollbar-thumb {
  background: #656565;
  border-radius: 0.25rem;
}

::-webkit-scrollbar-thumb:hover {
  background: #4b4b4b;
}

::-webkit-scrollbar-corner {
}
</style>
