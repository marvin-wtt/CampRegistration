<template>
  <q-layout view="hHh Lpr lFf">
    <q-ajax-bar color="accent" />

    <q-header bordered>
      <q-toolbar>
        <q-btn
          v-if="showDrawer"
          dense
          flat
          icon="menu"
          round
          @click="floatingDrawer = !floatingDrawer"
        />
        <q-toolbar-title>
          <q-skeleton
            v-if="campDetailStore.isLoading"
            type="text"
          />
          <router-link
            v-else
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

        <profile-menu
          :profile="user"
          @logout="logout()"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-if="showDrawer"
      v-model="drawer"
      :breakpoint="599.99"
      :mini="miniState && floatingDrawer"
      :width="220"
      bordered
      :mini-to-overlay="floatingDrawer"
      show-if-above
      class="column no-wrap"
      @mouseleave="miniState = true"
      @mouseenter="miniState = false"
    >
      <q-list padding>
        <q-item>
          <q-item-section
            v-if="miniState && floatingDrawer"
            avatar
          >
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>
            {{ campName }}
          </q-item-section>
        </q-item>

        <q-separator spaced />

        <navigation-item
          v-for="item in filteredItems"
          :key="item.name"
          v-bind="item"
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
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import NavigationItem from 'components/NavigationItem.vue';
import LocaleSwitch from 'components/common/localization/LocaleSwitch.vue';
import ProfileMenu from 'components/common/ProfileMenu.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useMeta } from 'quasar';
import { useRoute } from 'vue-router';
import { useAuthStore } from 'stores/auth-store';
import { useProfileStore } from 'stores/profile-store';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { storeToRefs } from 'pinia';
import HeaderNavigation from 'components/layout/HeaderNavigation.vue';
import type { NavigationItemProps } from 'components/NavigationItemProps.ts';

const route = useRoute();
const { t } = useI18n();
const { to } = useObjectTranslation();

const authStore = useAuthStore();
const profileStore = useProfileStore();
const campDetailStore = useCampDetailsStore();

const { user } = storeToRefs(profileStore);

async function init() {
  if (!user.value) {
    // Fetch user instead of init to force redirect on error
    await profileStore.fetchProfile();
  }
  if (route.params.camp) {
    await campDetailStore.fetchData();
  }
}
init();

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

const drawer = ref<boolean>(false);
const floatingDrawer = ref<boolean>(true);
const miniState = ref<boolean>(true);

const items: NavigationItemProps[] = [
  {
    name: 'participants',
    label: t('participants'),
    icon: 'groups',
    to: { name: 'participants' },
  },
  {
    name: 'contact',
    preview: true,
    label: t('contact'),
    icon: 'send',
    to: { name: 'management.camp.contact' },
  },
  {
    name: 'room_planner',
    label: t('room_planner'),
    icon: 'single_bed',
    to: { name: 'room-planner' },
  },
  {
    name: 'tools',
    preview: true,
    label: t('tools'),
    icon: 'menu',
    to: { name: 'tools' },
  },
  {
    name: 'settings',
    label: t('settings'),
    icon: 'settings',
    to: { name: 'management.settings' },
    separated: true,
    children: [
      {
        name: 'access',
        label: t('access'),
        icon: 'key',
        to: { name: 'access' },
      },
      {
        name: 'edit',
        label: t('edit'),
        icon: 'edit',
        to: { name: 'edit-camp' },
      },
      {
        name: 'email-templates',
        label: t('email_templates'),
        icon: 'email',
        to: { name: 'edit-email-templates' },
      },
      {
        name: 'files',
        label: t('files'),
        icon: 'folder',
        to: { name: 'edit-files' },
      },
      {
        name: 'form',
        label: t('form'),
        icon: 'feed',
        to: { name: 'edit-form' },
      },
    ],
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

const dev = computed<boolean>(() => {
  return process.env.NODE_ENV === 'development';
});

function logout() {
  authStore.logout();
}
</script>

<i18n lang="yaml" locale="en">
footer:
  imprint: 'Imprint'
  privacy_policy: 'Privacy Policy'

access: 'Access'
contact: 'Contact'
dashboard: 'Dashboard'
edit: 'Edit'
email_templates: 'Email templates'
files: 'Files'
form: 'Registration Form'
expenses: 'Expenses'
participants: 'Participants'
program_planner: 'Program'
room_planner: 'Room Planner'
settings: 'Settings'
statistics: 'Statistics'
tools: 'Tools'
notifications: 'Notifications'
</i18n>

<i18n lang="yaml" locale="de">
footer:
  imprint: 'Impressum'
  privacy_policy: 'Datenschutzerklärung'

access: 'Zugriff'
contact: 'Kontaktieren'
dashboard: 'Dashboard'
edit: 'Bearbeiten'
email_templates: 'E-Mail-Vorlagen'
files: 'Dateien'
expenses: 'Ausgaben'
form: 'Anmeldeformular'
participants: 'Teilnehmende'
program_planner: 'Programm'
room_planner: 'Raumplaner'
settings: 'Einstellungen'
statistics: 'Statistiken'
tools: 'Tools'
notifications: 'Benachrichtigungen'
</i18n>

<i18n lang="yaml" locale="fr">
footer:
  imprint: 'Mentions légales'
  privacy_policy: 'Politique de confidentialité'

access: 'Accès'
contact: 'Contacter'
dashboard: 'Dashboard'
edit: 'Modifier'
email_templates: "Modèles d'e-mails"
files: 'Fichiers'
expenses: 'Dépenses'
form: "formulaire d'inscription"
participants: 'Participants'
program_planner: 'Programme'
room_planner: 'Aménageur'
settings: 'Paramètres'
statistics: 'Statistiques'
tools: 'Tools'
notifications: 'Notifications'
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
