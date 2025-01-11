<template>
  <page-state-handler
    padding
    :error
    :loading
    class="row"
  >
    <div class="col-12 col-sm-4 col-md-2">
      <q-list padding>
        <template
          v-for="item in items"
          :key="item.name"
        >
          <navigation-item
            v-if="item.header"
            :header="item.header"
            :name="item.name"
            :label="item.label"
            :separated="item.separated"
            :preview="item.preview"
          />
          <navigation-item
            v-else
            :name="item.name"
            :label="item.label"
            :icon="item.icon"
            :to="item.to"
            :separated="item.separated"
            :preview="item.preview"
            :children="item.children"
          />
        </template>
      </q-list>
    </div>

    <div class="col-12 col-sm-8 col-md-10">
      <router-view v-slot="{ Component }">
        <transition name="fade">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useProfileStore } from 'stores/profile-store.ts';
import { storeToRefs } from 'pinia';
import NavigationItem from 'components/NavigationItem.vue';
import { NavigationItemProps } from 'components/NavigationItemProps.ts';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const profileStore = useProfileStore();
const { error, loading } = storeToRefs(profileStore);

const items: NavigationItemProps[] = [
  {
    name: 'general',
    header: true,
    label: t('general'),
  },
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
];
</script>

<i18n lang="yaml" locale="en">
account: 'Account'
general: 'General'
preferences: 'Preferences'
profile: 'Profile'
security: 'Security'
</i18n>

<i18n lang="yaml" locale="de">
account: 'Konto'
general: 'Allgemein'
preferences: 'Einstellungen'
profile: 'Profil'
security: 'Sicherheit'
</i18n>

<i18n lang="yaml" locale="fr">
account: 'Compte'
general: 'Général'
preferences: 'Préférences'
profile: 'Profil'
security: 'Sécurité'
</i18n>

<style scoped></style>
