<template>
  <q-layout view="hHh Lpr lFf">
    <q-ajax-bar color="accent" />

    <q-header bordered>
      <m-toolbar>
        <m-btn
          v-if="showDrawer"
          icon="menu"
          square
          round
          text
          @click="toggleDrawer"
        />
        <q-toolbar-title>
          <router-link
            to="/"
            class="header-link"
          >
            {{ t('app_name') }}
          </router-link>
        </q-toolbar-title>

        <header-navigation :administration="administrator" />

        <profile-menu />
      </m-toolbar>
    </q-header>

    <q-drawer
      v-if="showDrawer"
      v-model="drawer"
      :breakpoint="599.99"
      :mini="miniState && floatingDrawer"
      :width="300"
      :mini-width="96"
      bordered
      :mini-to-overlay="floatingDrawer"
      show-if-above
      class="column no-wrap"
      @mouseleave="miniState = true"
      @mouseenter="miniState = false"
    >
      <q-list class="q-list--rail">
        <navigation-item
          v-for="(item, i) in filteredItems"
          :key="item.name"
          v-bind="item"
          :first="i === 0"
        />
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
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import NavigationItem from 'components/NavigationItem.vue';
import ProfileMenu from 'components/common/ProfileMenu.vue';
import HeaderNavigation from 'components/layout/HeaderNavigation.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { useAuthStore } from 'stores/auth-store';
import { useProfileStore } from 'stores/profile-store';
import type { NavigationItemProps } from 'components/NavigationItemProps.ts';
import { usePermissions } from 'src/composables/permissions';
import { MToolbar } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eToolbar';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const quasar = useQuasar();
const route = useRoute();
const { t } = useI18n();
const { can } = usePermissions();

const authStore = useAuthStore();
const profileStore = useProfileStore();
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

const administrator = computed<boolean>(() => {
  return profileStore.user?.role === 'ADMIN';
});

const drawer = ref<boolean>(false);
const floatingDrawer = ref<boolean>(true);
const miniState = ref<boolean>(true);

watch(
  () => quasar.screen.lt.sm,
  () => {
    // Reset drawer when screen size changes
    drawer.value = false;
    floatingDrawer.value = true;
    miniState.value = true;
  },
);

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
  if (quasar.screen.lt.sm) {
    drawer.value = !drawer.value;
  } else {
    floatingDrawer.value = !floatingDrawer.value;
  }
}
</script>

<i18n lang="yaml" locale="en">
account: 'Account'
preferences: 'Preferences'
profile: 'Profile'
security: 'Security'
</i18n>

<i18n lang="yaml" locale="de">
account: 'Konto'
preferences: 'Präferenzen'
profile: 'Profil'
security: 'Sicherheit'
</i18n>

<i18n lang="yaml" locale="fr">
account: 'Compte'
preferences: 'Préférences'
profile: 'Profil'
security: 'Sécurité'
</i18n>

<i18n lang="yaml" locale="pl">
account: 'Konto'
preferences: 'Preferencje'
profile: 'Profil'
security: 'Bezpieczeństwo'
</i18n>

<i18n lang="yaml" locale="cs">
account: 'Účet'
preferences: 'Předvolby'
profile: 'Profil'
security: 'Zabezpečení'
</i18n>

<style scoped>
.header-link {
  text-decoration: none;
  color: inherit;
}
</style>

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
