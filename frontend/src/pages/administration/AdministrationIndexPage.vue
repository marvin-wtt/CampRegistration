<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <administration-card
        :label="t('users')"
        :to="{ name: 'administration.users' }"
      />
      <administration-card
        :label="t('camps')"
        :to="{ name: 'administration.camps' }"
      />
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import AdministrationCard from 'components/administration/AdministrationCard.vue';

const { t } = useI18n();
</script>

<style lang="scss" scoped></style>

<i18n lang="yaml" locale="en">
camps: 'Camps'
users: 'Users'
settings: 'Settings'
</i18n>

<i18n lang="yaml" locale="de">
camps: 'Camps'
users: 'Benutzer'
settings: 'Einstellungen'
</i18n>

<i18n lang="yaml" locale="fr">
camps: 'Camps'
users: 'Utilisateurs'
settings: 'Paramètres'
</i18n>
