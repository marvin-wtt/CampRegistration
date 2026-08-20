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
  </general-layout>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import type { NavigationItemProps } from '@/components/NavigationItemProps.ts';
import GeneralLayout from '@/components/layout/GeneralLayout.vue';
import WorkspaceSwitcher from '@/components/layout/WorkspaceSwitcher.vue';
import { computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth-store';

const { t } = useI18n();

const authStore = useAuthStore();

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
    name: 'organizations',
    label: t('organizations'),
    icon: 'apartment',
    to: { name: 'administration.organizations' },
  },
  {
    name: 'camps',
    label: t('camps'),
    icon: 'home',
    to: { name: 'administration.camps' },
  },
  {
    name: 'newsletters',
    label: t('newsletters'),
    icon: 'mail',
    to: { name: 'administration.newsletters' },
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

organizations: 'Organizations'
camps: 'Camps'
newsletters: 'Newsletters'
queues: 'Jobs'
users: 'Users'
settings: 'Settings'
legal: 'Legal Content'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Verwaltung'

organizations: 'Organisationen'
camps: 'Camps'
newsletters: 'Newsletter'
queues: 'Aufgaben'
users: 'Benutzer'
settings: 'Einstellungen'
legal: 'Rechtliches'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Administration'

organizations: 'Organisations'
camps: 'Camps'
newsletters: 'Newsletters'
queues: 'Tâches'
users: 'Utilisateurs'
settings: 'Paramètres'
legal: 'Contenu légal'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Administracja'

organizations: 'Organizacje'
camps: 'Obozy'
newsletters: 'Newslettery'
queues: 'Zadania'
users: 'Użytkownicy'
settings: 'Ustawienia'
legal: 'Treści prawne'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Administrace'

organizations: 'Organizace'
camps: 'Tábory'
newsletters: 'Newslettery'
queues: 'Úlohy'
users: 'Uživatelé'
settings: 'Nastavení'
legal: 'Právní obsah'
</i18n>

<style scoped></style>
