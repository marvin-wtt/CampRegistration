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
      </div>

      <q-list class="q-list--rail">
        <q-separator
          v-if="quasar.screen.gt.xs"
          inset
          class="rail-separator"
        />

        <navigation-item
          v-for="(item, i) in filteredItems"
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
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth-store';
import { useQuasar } from 'quasar';
import type { NavigationItemProps } from 'components/NavigationItemProps.ts';
import { usePermissions } from 'src/composables/permissions';
import { MToolbar } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eToolbar';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const quasar = useQuasar();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { can } = usePermissions();

const authStore = useAuthStore();
const campDetailStore = useCampDetailsStore();

onMounted(async () => {
  await authStore.init();

  if (route.params.campId) {
    await campDetailStore.fetchData();
  }
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

const items = computed<NavigationItemProps[]>(() => [
  {
    name: 'profile',
    label: t('profile'),
    icon: 'account_circle',
    to: { path: '/settings/profile' },
  },
  {
    name: 'security',
    label: t('security'),
    icon: 'security',
    to: { path: '/settings/security' },
  },
  {
    name: 'preferences',
    label: t('preferences'),
    icon: 'colorize',
    to: undefined,
  },
  {
    name: 'account',
    label: t('account'),
    icon: 'settings',
    to: { path: '/settings/account' },
  },
]);

const filteredItems = computed<NavigationItemProps[]>(() => {
  return filterItems(items.value);
});

function filterItems(navItems: NavigationItemProps[]): NavigationItemProps[] {
  return navItems
    .filter((item) => !item.permission || can(item.permission))
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

function navigateBack() {
  if (window.history.state?.back) {
    router.back();
    return;
  }

  void router.push('/');
}
</script>

<i18n lang="yaml" locale="en">
account: 'Account'
back: 'Back'
preferences: 'Preferences'
profile: 'Profile'
security: 'Security'
</i18n>

<i18n lang="yaml" locale="de">
account: 'Konto'
back: 'Zurück'
preferences: 'Präferenzen'
profile: 'Profil'
security: 'Sicherheit'
</i18n>

<i18n lang="yaml" locale="fr">
account: 'Compte'
back: 'Retour'
preferences: 'Préférences'
profile: 'Profil'
security: 'Sécurité'
</i18n>

<i18n lang="yaml" locale="pl">
account: 'Konto'
back: 'Wstecz'
preferences: 'Preferencje'
profile: 'Profil'
security: 'Bezpieczeństwo'
</i18n>

<i18n lang="yaml" locale="cs">
account: 'Účet'
back: 'Zpět'
preferences: 'Předvolby'
profile: 'Profil'
security: 'Zabezpečení'
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
