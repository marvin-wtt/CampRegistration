<template>
  <general-layout
    :navigation-items="items"
    :title="t('title')"
  >
    <template #toolbar>
      <workspace-switcher />
    </template>

    <template #navigation>
      <workspace-switcher rail />
    </template>

    <template
      v-if="administratorNeedsTwoFactor"
      #default
    >
      <administrator-two-factor-required />
    </template>
  </general-layout>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import type { NavigationItemProps } from '@/components/NavigationItemProps.ts';
import GeneralLayout from '@/components/layout/GeneralLayout.vue';
import WorkspaceSwitcher from '@/components/layout/WorkspaceSwitcher.vue';
import { computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth-store';
import { useProfileStore } from '@/stores/profile-store';
import { storeToRefs } from 'pinia';
import AdministratorTwoFactorRequired from '@/components/administration/AdministratorTwoFactorRequired.vue';

const { t } = useI18n();

const authStore = useAuthStore();
const { administratorNeedsTwoFactor } = storeToRefs(useProfileStore());

onMounted(async () => {
  await authStore.init();
});

const items = computed<NavigationItemProps[]>(() => [
  {
    name: 'users',
    label: t('users'),
    icon: 'person',
    to: { name: 'administration.users' },
  },
  {
    name: 'events',
    label: t('events'),
    icon: 'home',
    to: { name: 'administration.events' },
  },
  {
    name: 'newsletters',
    label: t('newsletters'),
    icon: 'mail',
    to: { name: 'administration.newsletters' },
  },
  {
    name: 'organizations',
    label: t('organizations'),
    icon: 'apartment',
    to: { name: 'administration.organizations' },
  },
  {
    name: 'access',
    label: t('access'),
    icon: 'shield',
    to: { name: 'administration.access' },
  },
  {
    name: 'queues',
    label: t('queues'),
    icon: 'queue',
    to: { name: 'administration.queues' },
  },
  {
    name: 'legal',
    label: t('legal'),
    icon: 'gavel',
    to: { name: 'administration.legal' },
  },
]);
</script>

<i18n lang="yaml" locale="en">
title: 'Administration'

access: 'Administrator access'
organizations: 'Organizations'
events: 'Events'
newsletters: 'Newsletters'
queues: 'Jobs'
users: 'Users'
settings: 'Settings'
legal: 'Legal Content'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Verwaltung'

access: 'Administratorzugriff'
organizations: 'Organisationen'
events: 'Veranstaltungen'
newsletters: 'Newsletter'
queues: 'Aufgaben'
users: 'Benutzer'
settings: 'Einstellungen'
legal: 'Rechtliches'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Administration'

access: 'Accès administrateur'
organizations: 'Organisations'
events: 'Événements'
newsletters: 'Newsletters'
queues: 'Tâches'
users: 'Utilisateurs'
settings: 'Paramètres'
legal: 'Contenu légal'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Administracja'

access: 'Dostęp administratora'
organizations: 'Organizacje'
events: 'Wydarzenia'
newsletters: 'Newslettery'
queues: 'Zadania'
users: 'Użytkownicy'
settings: 'Ustawienia'
legal: 'Treści prawne'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Administrace'

access: 'Přístup administrátora'
organizations: 'Organizace'
events: 'Akce'
newsletters: 'Newslettery'
queues: 'Úlohy'
users: 'Uživatelé'
settings: 'Nastavení'
legal: 'Právní obsah'
</i18n>

<style scoped></style>
