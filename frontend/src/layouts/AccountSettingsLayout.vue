<template>
  <general-layout :navigation-items="items" />
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import GeneralLayout from '@/components/layout/GeneralLayout.vue';
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
