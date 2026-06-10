<template>
  <m-btn
    v-if="props.administration"
    :label="t('administration')"
    :to="{ name: 'administration' }"
    class="gt-sm"
    square
    text
  />
  <m-btn
    :label="t('newsletters')"
    :to="{ name: 'management.newsletters' }"
    class="gt-sm"
    square
    text
  />
  <m-btn
    :label="t('camps')"
    :to="{ name: 'management.camps' }"
    class="gt-sm"
    square
    text
  />
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

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
