<template>
  <general-layout
    :navigation-items="items"
    :title="t('title')"
  >
    <template #toolbar="{ drawer }">
      <workspace-switcher v-if="drawer" />
    </template>

    <template #navigation>
      <workspace-switcher rail />
    </template>
  </general-layout>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import GeneralLayout from '@/components/layout/GeneralLayout.vue';
import WorkspaceSwitcher from '@/components/layout/WorkspaceSwitcher.vue';
import { useAuthStore } from '@/stores/auth-store';
import type { NavigationItemProps } from '@/components/NavigationItemProps.ts';

const { t } = useI18n();

const authStore = useAuthStore();

onMounted(async () => {
  await authStore.init();
});

const items = computed<NavigationItemProps[]>(() => [
  {
    name: 'profile',
    label: t('profile'),
    icon: 'account_circle',
    to: { name: 'settings.profile' },
  },
  {
    name: 'security',
    label: t('security'),
    icon: 'security',
    to: { name: 'settings.security' },
  },
  {
    name: 'account',
    label: t('account'),
    icon: 'settings',
    to: { name: 'settings.account' },
  },
]);
</script>

<i18n lang="yaml" locale="en">
title: 'Account'
account: 'Account'
profile: 'Profile'
security: 'Security'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Konto'
account: 'Konto'
profile: 'Profil'
security: 'Sicherheit'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Compte'
account: 'Compte'
profile: 'Profil'
security: 'Sécurité'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Konto'
account: 'Konto'
profile: 'Profil'
security: 'Bezpieczeństwo'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Účet'
account: 'Účet'
profile: 'Profil'
security: 'Zabezpečení'
</i18n>
