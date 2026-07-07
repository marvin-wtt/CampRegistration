<template>
  <q-layout
    view="hHh Lpr lFf"
    @scroll="onScroll"
  >
    <q-ajax-bar color="accent" />

    <!-- Top bar: only when there is no rail or on mobile, where the rail is
         hidden off-canvas. On desktop the rail carries nav + profile. -->
    <q-header
      v-if="!showDrawer || quasar.screen.lt.sm"
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
          v-else-if="!loading"
          icon="arrow_back"
          square
          round
          text
          :aria-label="t('back')"
          @click="navigateBack()"
        />

        <slot
          name="toolbar"
          :drawer="showDrawer"
        >
          <q-toolbar-title>
            {{ title }}
          </q-toolbar-title>
        </slot>
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
      <!-- Rail header: back to the app (desktop only — mobile uses the top bar) -->
      <div
        v-if="quasar.screen.gt.xs"
        class="rail-header row justify-center q-py-sm"
      >
        <slot name="navigation">
          <m-btn
            icon="arrow_back"
            round
            text
            :aria-label="t('back')"
            @click="navigateBack()"
          >
            <q-tooltip
              anchor="center right"
              self="center left"
            >
              {{ t('back') }}
            </q-tooltip>
          </m-btn>
        </slot>
      </div>

      <q-separator
        v-if="quasar.screen.gt.xs"
        inset
      />

      <q-list
        v-if="navigationItems"
        class="q-list--rail"
      >
        <template v-if="loading">
          <navigation-item-skeleton
            v-for="(item, i) in navigationItems"
            :key="item.name"
            :label="item.label"
            :separated="item.separated"
            :first="i === 0"
          />
        </template>
        <template v-else>
          <navigation-item
            v-for="(item, i) in navigationItems"
            :key="item.name"
            v-bind="item"
            :first="i === 0"
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

    <!-- Newsletters has no sub-navigation, so on large screens it uses floating
         controls (back + profile) instead of a rail, keeping the profile in the
         same bottom-left spot as every other layout. -->
    <layout-floating-controls
      v-if="!showDrawer && quasar.screen.gt.xs"
      :back-to="backTo"
    />

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="fade">
          <slot :component="Component">
            <component :is="Component" />
          </slot>
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import NavigationItem from '@/components/NavigationItem.vue';
import ProfileMenu from '@/components/common/ProfileMenu.vue';
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router';
import { useMeta, useQuasar } from 'quasar';
import type { NavigationItemProps } from '@/components/NavigationItemProps.ts';
import { MToolbar } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eToolbar';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import NavigationItemSkeleton from '@/components/NavigationItemSkeleton.vue';
import LayoutFloatingControls from '@/components/layout/LayoutFloatingControls.vue';

const quasar = useQuasar();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const {
  navigationItems,
  backTo,
  loading = false,
  title = '',
} = defineProps<{
  navigationItems?: NavigationItemProps[];
  backTo?: RouteLocationRaw;
  title?: string;
  loading?: boolean;
}>();

useMeta(() => {
  return {
    title,
    titleTemplate: (title) => `${title} | ${t('app_name')}`,
  };
});

const showDrawer = computed<boolean>(() => {
  return !('hideDrawer' in route.meta) || route.meta.hideDrawer !== true;
});

const drawer = ref<boolean>(false);

// Top app bar elevates once content scrolls beneath it (MD3 small top app bar).
const scrolled = ref<boolean>(false);

function onScroll(info: { position: { top: number } | number }) {
  const top =
    typeof info.position === 'number' ? info.position : info.position.top;
  scrolled.value = top > 0;
}

function toggleDrawer() {
  drawer.value = !drawer.value;
}

function navigateBack() {
  if (backTo) {
    void router.push(backTo);
    return;
  }

  if (window.history.state?.back) {
    router.back();
    return;
  }

  void router.push('/');
}
</script>

<i18n lang="yaml" locale="en">
back: 'Back'
</i18n>

<i18n lang="yaml" locale="de">
back: 'Zurück'
</i18n>

<i18n lang="yaml" locale="fr">
back: 'Retour'
</i18n>

<i18n lang="yaml" locale="pl">
back: 'Wstecz'
</i18n>

<i18n lang="yaml" locale="cs">
back: 'Zpět'
</i18n>

<style>
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
</style>
