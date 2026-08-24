<template>
  <general-layout
    :title="title"
    :navigation-items="navigationItems"
    :loading="isLoading"
  >
    <template #toolbar>
      <workspace-switcher />
    </template>

    <template #navigation>
      <workspace-switcher rail />
    </template>

    <template #default="{ component }">
      <component
        :is="component"
        :key="organizationId"
      />
    </template>
  </general-layout>
</template>

<script lang="ts" setup>
import { computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import GeneralLayout from '@/components/layout/GeneralLayout.vue';
import { useAuthStore } from '@/stores/auth-store';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import WorkspaceSwitcher from '@/components/layout/WorkspaceSwitcher.vue';
import { useOrganizationDetailsStore } from '@/stores/organization-details-store';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';
import type { NavigationItemProps } from '@/components/NavigationItemProps';
import type { OrganizationPermission } from '@camp-registration/common/permissions';

const { t } = useI18n();
const authStore = useAuthStore();
const route = useRoute();
const organizationStore = useOrganizationDetailsStore();
const { data: organization, isLoading } = storeToRefs(organizationStore);
const { canAccessOrg } = useOrganizationPermissions();

const organizationId = computed(
  () => route.params.organizationId as string | undefined,
);

const title = computed(() =>
  organizationId.value ? (organization.value?.name ?? '') : t('title'),
);

interface OrganizationNavigationItem {
  name: string;
  label: string;
  icon: string;
  to: { name: string };
  permission: OrganizationPermission;
}

const navigationItems = computed<NavigationItemProps<'organization'>[]>(() => {
  if (!organizationId.value) {
    return [];
  }

  const items: OrganizationNavigationItem[] = [
    {
      name: 'dashboard',
      label: t('nav.dashboard'),
      icon: 'dashboard',
      to: { name: 'management.organization.dashboard' },
      permission: 'organization.view',
    },
    {
      name: 'camps',
      label: t('nav.camps'),
      icon: 'holiday_village',
      to: { name: 'management.organization.camps' },
      permission: 'organization.camps.view',
    },
    {
      name: 'newsletters',
      label: t('nav.newsletters'),
      icon: 'mail',
      to: { name: 'management.organization.newsletters' },
      permission: 'organization.newsletters.view',
    },
    {
      name: 'members',
      label: t('nav.members'),
      icon: 'group',
      to: { name: 'management.organization.members' },
      permission: 'organization.members.view',
    },
    {
      name: 'privacy',
      label: t('nav.privacy'),
      icon: 'privacy_tip',
      to: { name: 'management.organization.privacy' },
      permission: 'organization.view',
    },
    {
      name: 'settings',
      label: t('nav.settings'),
      icon: 'settings',
      to: { name: 'management.organization.settings' },
      permission: 'organization.edit',
    },
  ];

  return items.filter((item) => canAccessOrg(item.permission));
});

watch(
  organizationId,
  async (id) => {
    if (id) {
      await organizationStore.fetchData(id);
    }
  },
  { immediate: true },
);

onMounted(async () => {
  await authStore.init();
});
</script>

<i18n lang="yaml" locale="en">
title: 'Organizations'
nav:
  dashboard: 'Overview'
  camps: 'Camps'
  newsletters: 'Newsletters'
  members: 'Members'
  privacy: 'Privacy'
  settings: 'Settings'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Organisationen'
nav:
  dashboard: 'Übersicht'
  camps: 'Camps'
  newsletters: 'Newsletter'
  members: 'Mitglieder'
  privacy: 'Datenschutz'
  settings: 'Einstellungen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Organisations'
nav:
  dashboard: 'Aperçu'
  camps: 'Camps'
  newsletters: 'Newsletters'
  members: 'Membres'
  privacy: 'Confidentialité'
  settings: 'Paramètres'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Organizacje'
nav:
  dashboard: 'Przegląd'
  camps: 'Obozy'
  newsletters: 'Newslettery'
  members: 'Członkowie'
  privacy: 'Prywatność'
  settings: 'Ustawienia'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Organizace'
nav:
  dashboard: 'Přehled'
  camps: 'Tábory'
  newsletters: 'Newslettery'
  members: 'Členové'
  privacy: 'Soukromí'
  settings: 'Nastavení'
</i18n>
