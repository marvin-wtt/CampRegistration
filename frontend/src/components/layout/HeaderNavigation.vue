<template>
  <q-btn
    v-if="props.administration"
    :label="t('administration')"
    :to="{ name: 'administration' }"
    class="gt-sm"
    flat
    rounded
  />
  <q-btn
    :label="t('newsletters')"
    :to="{ name: 'newsletters' }"
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

const props = defineProps<{
  administration: boolean;
}>();
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
administration: 'Administration'
newsletters: 'Newsletters'
camps: 'My Camps'
</i18n>

<i18n lang="yaml" locale="de">
administration: 'Verwaltung'
newsletters: 'Newsletter'
camps: 'Meine Camps'
</i18n>

<i18n lang="yaml" locale="fr">
administration: 'Administration'
newsletters: 'Newsletters'
camps: 'Mes Camps'
</i18n>

<i18n lang="yaml" locale="pl">
administration: 'Administracja'
newsletters: 'Newslettery'
camps: 'Moje obozy'
</i18n>

<i18n lang="yaml" locale="cs">
administration: 'Administrace'
newsletters: 'Newslettery'
camps: 'Moje tábory'
</i18n>
