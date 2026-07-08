<template>
  <general-layout
    :navigation-items="items"
    :title="t('title')"
    :back-to="backTo"
  />
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import type { NavigationItemProps } from '@/components/NavigationItemProps.ts';
import GeneralLayout from '@/components/layout/GeneralLayout.vue';
import { computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth-store';
import { useRoute, type RouteLocationRaw } from 'vue-router';

const { t } = useI18n();
const route = useRoute();

const authStore = useAuthStore();

onMounted(async () => {
  await authStore.init();
});

const backTo = computed<RouteLocationRaw>(() => {
  if (route.name === 'administration') {
    return { name: 'management' };
  }

  return { name: 'administration' };
});

const items = computed<NavigationItemProps[]>(() => [
  {
    name: 'users',
    label: t('users'),
    icon: 'person',
    to: { name: 'administration.users' },
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
]);
</script>

<i18n lang="yaml" locale="en">
title: 'Administration'

camps: 'Camps'
newsletters: 'Newsletters'
queues: 'Queues'
users: 'Users'
settings: 'Settings'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Verwaltung'

camps: 'Camps'
newsletters: 'Newsletter'
queues: 'Warteschlangen'
users: 'Benutzer'
settings: 'Einstellungen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Administration'

camps: 'Camps'
newsletters: 'Newsletters'
queues: "Files d'attente"
users: 'Utilisateurs'
settings: 'Paramètres'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Administracja'

camps: 'Obozy'
newsletters: 'Newslettery'
queues: 'Kolejki'
users: 'Użytkownicy'
settings: 'Ustawienia'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Administrace'

camps: 'Tábory'
newsletters: 'Newslettery'
queues: 'Fronty'
users: 'Uživatelé'
settings: 'Nastavení'
</i18n>

<style scoped></style>
