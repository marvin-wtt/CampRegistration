<template>
  <general-layout
    :title="title"
    :back-to="backTo"
    :navigation-items="navigationItems"
    :loading="isLoading"
  />
</template>

<script lang="ts" setup>
import { computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import GeneralLayout from '@/components/layout/GeneralLayout.vue';
import { useAuthStore } from '@/stores/auth-store';
import { useRoute, type RouteLocationRaw } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useOrganizationDetailsStore } from '@/stores/organization-details-store';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';
import type { NavigationItemProps } from '@/components/NavigationItemProps';
import type { OrganizationPermission } from '@camp-registration/common/permissions';

const { t } = useI18n();
const authStore = useAuthStore();
const route = useRoute();
const organizationStore = useOrganizationDetailsStore();
const { data: organization, isLoading } = storeToRefs(organizationStore);
const { canAccessAnyOrg } = useOrganizationPermissions();

const organizationId = computed(
  () => route.params.organizationId as string | undefined,
);

const title = computed(() =>
  organizationId.value ? (organization.value?.name ?? '') : t('title'),
);

const backTo = computed<RouteLocationRaw>(() => {
  if (route.name === 'management.organizations') {
    return { name: 'management' };
  }

  return { name: 'management.organizations' };
});

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
      name: 'camps',
      label: t('nav.camps'),
      icon: 'holiday_village',
      to: { name: 'management.organization.camps' },
      permission: 'organization.camps.view',
    },
    {
      name: 'members',
      label: t('nav.members'),
      icon: 'group',
      to: { name: 'management.organization.members' },
      permission: 'organization.members.view',
    },
    {
      name: 'verification',
      label: t('nav.verification'),
      icon: 'verified_user',
      to: { name: 'management.organization.verification' },
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

  return items.filter((item) => canAccessAnyOrg(item.permission));
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
  camps: 'Camps'
  members: 'Members'
  verification: 'Verification'
  settings: 'Settings'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Organisationen'
nav:
  camps: 'Camps'
  members: 'Mitglieder'
  verification: 'Verifizierung'
  settings: 'Einstellungen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Organisations'
nav:
  camps: 'Camps'
  members: 'Membres'
  verification: 'Vérification'
  settings: 'Paramètres'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Organizacje'
nav:
  camps: 'Obozy'
  members: 'Członkowie'
  verification: 'Weryfikacja'
  settings: 'Ustawienia'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Organizace'
nav:
  camps: 'Tábory'
  members: 'Členové'
  verification: 'Ověření'
  settings: 'Nastavení'
</i18n>
