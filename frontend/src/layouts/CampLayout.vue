<template>
  <q-layout view="hHh Lpr fFf">
    <!-- Be sure to play with the Layout demo on docs -->

    <!-- (Optional) The Header -->
    <q-header bordered>
      <q-toolbar>
        <q-toolbar-title>
          <router-link
            to="/"
            style="text-decoration: none; color: inherit"
          >
            {{ title }}
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

        <locale-switch
          borderless
          class="q-px-md"
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
import LocaleSwitch from 'components/common/localization/LocaleSwitch.vue';
import { useI18n } from 'vue-i18n';
import { useMeta } from 'quasar';
import ProfileMenu from 'components/common/ProfileMenu.vue';
import HelpFab from 'components/FeedbackFab.vue';
import { useProfileStore } from 'stores/profile-store';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import HeaderNavigation from 'components/layout/HeaderNavigation.vue';
import { useAuthStore } from 'stores/auth-store';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useObjectTranslation } from 'src/composables/objectTranslation';

const { t } = useI18n();
const { to } = useObjectTranslation();
const authStore = useAuthStore();
const profileStore = useProfileStore();
const { user } = storeToRefs(profileStore);
const campDetailStore = useCampDetailsStore();
const { data: camp } = storeToRefs(campDetailStore);

useMeta(() => {
  return {
    title: camp.value ? to(camp.value.name) : t('camps'),
    titleTemplate: (title) => `${title} | ${t('app_name')}`,
  };
});

const title = computed<string>(() => {
  return camp.value ? to(camp.value.name) : t('app_name');
});

if (!profileStore.user) {
  authStore.init();
}

const administrator = computed<boolean>(() => {
  return profileStore.user?.role === 'ADMIN';
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
