<template>
  <q-layout
    view="hHh Lpr lFf"
    @scroll="onScroll"
  >
    <q-ajax-bar color="accent" />

    <!-- Top bar: mobile only. Desktop uses either the rail or floating controls. -->
    <q-header
      v-if="showTopBar"
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
        <!-- Without a drawer there is nothing to open, and a layout that fills
             the navigation slot puts the switcher in this toolbar — so a back
             arrow beside it would be a second, weaker way to move. -->
        <m-btn
          v-else-if="!slots.navigation"
          :aria-label="t('back')"
          icon="arrow_back"
          :to="backRoute"
          square
          round
          text
        />
        <!-- Placeholder so the switcher keeps the same position whether or not
             this route has a drawer to open. Same button, so same geometry. -->
        <m-btn
          v-else
          class="invisible"
          icon="menu"
          aria-hidden="true"
          tabindex="-1"
          disable
          square
          round
          text
        />

        <div class="col app-top-bar__lead">
          <slot
            name="toolbar"
            :drawer="showDrawer"
          >
            <q-toolbar-title>
              {{ title }}
            </q-toolbar-title>
          </slot>
        </div>

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
            :aria-label="t('back')"
            icon="arrow_back"
            :to="backRoute"
            round
            text
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

    <!-- Index pages have no sub-navigation, so on large screens they use
         floating controls instead of an empty rail, keeping the switcher and
         the profile in the same spots as every other layout. -->
    <layout-floating-controls
      v-if="showFloatingControls"
      :back-to="backRoute"
    >
      <template
        v-if="slots.navigation"
        #navigation
      >
        <slot name="navigation" />
      </template>
    </layout-floating-controls>

    <q-page-container
      :class="{ 'q-page-container--floating-controls': showFloatingControls }"
    >
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
import { computed, ref, useSlots } from 'vue';
import { useI18n } from 'vue-i18n';
import NavigationItem from '@/components/NavigationItem.vue';
import ProfileMenu from '@/components/common/ProfileMenu.vue';
import { useRoute, type RouteLocationRaw, useRouter } from 'vue-router';
import { useMeta, useQuasar } from 'quasar';
import type { NavigationItemProps } from '@/components/NavigationItemProps.ts';
import { MToolbar } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eToolbar';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import NavigationItemSkeleton from '@/components/NavigationItemSkeleton.vue';
import LayoutFloatingControls from '@/components/layout/LayoutFloatingControls.vue';

const quasar = useQuasar();
const route = useRoute();
const router = useRouter();
const slots = useSlots();
const { t } = useI18n();

const {
  navigationItems,
  backTo,
  loading = false,
  title = '',
} = defineProps<{
  navigationItems?: NavigationItemProps[];
  backTo?: RouteLocationRaw | undefined;
  title?: string | undefined;
  loading?: boolean;
}>();

useMeta(() => {
  return {
    title,
    titleTemplate: (title) => `${title} | ${t('app_name')}`,
  };
});

const showDrawer = computed<boolean>(() => {
  if ('hideDrawer' in route.meta && route.meta.hideDrawer === true) {
    return false;
  }

  // Without sub-sections the rail would be an empty column, so those routes
  // fall back to floating controls — which carry the same switcher.
  return !(!navigationItems || navigationItems.length <= 0);
});

const showFloatingControls = computed<boolean>(() => {
  return !showDrawer.value && quasar.screen.gt.xs;
});

const showTopBar = computed<boolean>(() => {
  return (
    !showFloatingControls.value && (!showDrawer.value || quasar.screen.lt.sm)
  );
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

function isCurrentRoute(target: RouteLocationRaw) {
  try {
    return (
      router.resolve(target).fullPath === router.currentRoute.value.fullPath
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) {
    return true;
  }
}

const backRoute = computed<RouteLocationRaw>(() => {
  if (backTo && !isCurrentRoute(backTo)) {
    return backTo;
  }

  // Use the camp list as first fallback layer
  const fallback = {
    name: 'management.camps',
  };

  if (!isCurrentRoute(fallback)) {
    return fallback;
  }

  return '/';
});
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

/* The floating controls are fixed-position, so the page has to reserve their
   width itself: the 16px offset plus the switcher pill, whose caption is
   hidden in this mode. */
.q-page-container--floating-controls {
  padding-left: 56px;
}

/* Lets the switcher take the width the toolbar has left, so a long camp name
   gets room and ellipsises there instead of pushing the avatar off-screen. */
.app-top-bar__lead {
  min-width: 0;
}

/* MD3 only applies margin to the left - apply right margin manually */
.q-drawer__content .q-separator--horizontal-inset {
  margin-right: 16px;
}
</style>
