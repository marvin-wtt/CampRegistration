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
      <administration-card
        :label="t('newsletters')"
        :to="{ name: 'administration.newsletters' }"
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
newsletters: 'Newsletters'
users: 'Users'
settings: 'Settings'
</i18n>

<i18n lang="yaml" locale="de">
camps: 'Camps'
newsletters: 'Newsletter'
users: 'Benutzer'
settings: 'Einstellungen'
</i18n>

<i18n lang="yaml" locale="fr">
camps: 'Camps'
newsletters: 'Newsletters'
users: 'Utilisateurs'
settings: 'Paramètres'
</i18n>

<i18n lang="yaml" locale="pl">
camps: 'Obozy'
newsletters: 'Newslettery'
users: 'Użytkownicy'
settings: 'Ustawienia'
</i18n>

<i18n lang="yaml" locale="cs">
camps: 'Tábory'
newsletters: 'Newslettery'
users: 'Uživatelé'
settings: 'Nastavení'
</i18n>
