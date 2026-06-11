<template>
  <q-layout view="hHh Lpr lFf">
    <q-ajax-bar color="accent" />

    <q-header bordered>
      <m-toolbar>
        <m-btn
          v-if="quasar.screen.gt.xs"
          icon="arrow_back"
          square
          round
          text
          @click="navigateHome()"
        />
        <m-btn
          v-else-if="showDrawer"
          icon="menu"
          square
          round
          text
          @click="toggleDrawer"
        />
        <q-toolbar-title>
          <q-skeleton
            v-if="campDetailStore.isLoading"
            type="text"
          />
          {{ to(title) }}
        </q-toolbar-title>

        <header-navigation :administration="administrator" />

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
        <template v-if="quasar.screen.lt.sm">
          <q-item
            clickable
            v-ripple
            @click="navigateHome"
          >
            <q-item-section avatar>
              <q-icon name="arrow_back" />
            </q-item-section>
            <q-item-section>
              {{ t('camps') }}
            </q-item-section>
          </q-item>

          <q-separator spaced />
        </template>

        <navigation-item
          v-for="(item, i) in filteredItems"
          :key="item.name"
          v-bind="item"
          :first="i === 0"
        />
      </q-list>

      <q-space />

      <q-list padding>
        <q-item
          clickable
          :to="{ name: 'imprint' }"
        >
          <q-item-section>
            <q-item-label>
              {{ t('footer.imprint') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          :to="{ name: 'privacy-policy' }"
        >
          <q-item-section>
            <q-item-label>
              {{ t('footer.privacy_policy') }}
            </q-item-label>
          </q-item-section>
        </q-item>
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
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import NavigationItem from 'components/NavigationItem.vue';
import ProfileMenu from 'components/common/ProfileMenu.vue';
import HeaderNavigation from 'components/layout/HeaderNavigation.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useMeta, useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth-store';
import { useProfileStore } from 'stores/profile-store';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import type { NavigationItemProps } from 'components/NavigationItemProps.ts';
import { usePermissions } from 'src/composables/permissions';
import { MToolbar } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eToolbar';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const quasar = useQuasar();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { to } = useObjectTranslation();
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

const title = computed(() => {
  return showDrawer.value ? campName.value : t('app_name');
});

const campName = computed<string | undefined>(() => {
  return to(campDetailStore.data?.name);
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

const drawer = ref<boolean>(true);

const items = computed<NavigationItemProps[]>(() => [
  {
    name: 'dashboard',
    label: t('dashboard'),
    icon: 'dashboard',
    permission: 'camp.registrations.view',
    to: { name: 'management.camp.dashboard' },
  },
  {
    name: 'participants',
    label: t('participants'),
    icon: 'groups',
    permission: 'camp.registrations.view',
    to: { name: 'management.camp.participants' },
  },
  {
    name: 'contact',
    label: t('contact'),
    icon: 'send',
    permission: 'camp.messages.create',
    to: { name: 'management.camp.contact' },
  },
  {
    name: 'program_planner',
    label: t('program_planner'),
    icon: 'event',
    permission: 'camp.program_events.view',
    to: { name: 'management.camp.program-planner' },
  },
  {
    name: 'room_planner',
    label: t('room_planner'),
    icon: 'single_bed',
    permission: 'camp.rooms.view',
    to: { name: 'management.camp.room-planner' },
  },
  {
    name: 'settings',
    label: t('settings'),
    icon: 'settings',
    to: { name: 'management.camp.settings' },
    separated: true,
  },
]);

const filteredItems = computed<NavigationItemProps[]>(() => {
  return filterItems(items.value);
});

function filterItems(navItems: NavigationItemProps[]): NavigationItemProps[] {
  return navItems
    .filter((item) => dev.value || !item.preview)
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

const dev = computed<boolean>(() => {
  return process.env.NODE_ENV === 'development';
});

function toggleDrawer() {
  drawer.value = !drawer.value;
}

function navigateHome() {
  if (route.name === 'management') {
    void router.push({ name: 'camps' });
    return;
  }

  if (route.name === 'management.camps') {
    void router.push({ name: 'management' });
    return;
  }

  void router.push({ name: 'management.camps' });
}
</script>

<i18n lang="yaml" locale="en">
footer:
  imprint: 'Imprint'
  privacy_policy: 'Privacy Policy'

camps: 'My Camps'
contact: 'Contact'
dashboard: 'Dashboard'
participants: 'Participants'
program_planner: 'Program'
room_planner: 'Room Planner'
settings: 'Settings'
statistics: 'Statistics'
</i18n>

<i18n lang="yaml" locale="de">
footer:
  imprint: 'Impressum'
  privacy_policy: 'Datenschutzerklärung'

camps: 'Meine Camps'
contact: 'Kontaktieren'
dashboard: 'Dashboard'
participants: 'Teilnehmende'
program_planner: 'Programm'
room_planner: 'Raumplaner'
settings: 'Einstellungen'
statistics: 'Statistiken'
tools: 'Tools'
</i18n>

<i18n lang="yaml" locale="fr">
footer:
  imprint: 'Mentions légales'
  privacy_policy: 'Politique de confidentialité'

camps: 'Mes Camps'
contact: 'Contacter'
dashboard: 'Dashboard'
participants: 'Participants'
program_planner: 'Programme'
room_planner: 'Aménageur'
settings: 'Paramètres'
statistics: 'Statistiques'
tools: 'Tools'
</i18n>

<i18n lang="yaml" locale="pl">
footer:
  imprint: 'Nota prawna'
  privacy_policy: 'Polityka prywatności'

camps: 'Moje Campy'
contact: 'Kontakt'
dashboard: 'Panel główny'
participants: 'Uczestnicy'
program_planner: 'Program'
room_planner: 'Plan pokoi'
settings: 'Ustawienia'
statistics: 'Statystyki'
tools: 'Narzędzia'
</i18n>

<i18n lang="yaml" locale="cs">
footer:
  imprint: 'Tiráž'
  privacy_policy: 'Zásady ochrany osobních údajů'

camps: 'Moje Campy'
contact: 'Kontakt'
dashboard: 'Přehled'
participants: 'Účastníci'
program_planner: 'Program'
room_planner: 'Plán pokojů'
settings: 'Nastavení'
statistics: 'Statistiky'
tools: 'Nástroje'
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
