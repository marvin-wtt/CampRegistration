<template>
  <q-btn
    :label="t('administration')"
    :to="{ name: 'administration' }"
    class="gt-sm"
    flat
    rounded
  />
  <q-btn
    :label="t('camps')"
    :to="{ name: 'management' }"
    class="gt-sm"
    flat
    rounded
  />
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
administration: 'Administration'
camps: 'My Camps'
</i18n>

<i18n lang="yaml" locale="de">
administration: 'Verwaltung'
camps: 'Meine Camps'
</i18n>

<i18n lang="yaml" locale="fr">
administration: 'Administration'
camps: 'Mes Camps'
</i18n>
