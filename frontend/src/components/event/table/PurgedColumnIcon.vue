<template>
  <q-icon
    name="auto_delete"
    size="16px"
    class="q-ml-xs"
    :class="printing ? undefined : 'text-on-surface-variant'"
    :aria-label="t('column')"
  >
    <q-tooltip v-if="!printing">{{ t('column') }}</q-tooltip>
  </q-icon>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const { printing = false } = defineProps<{ printing?: boolean }>();

const { t } = useI18n();
</script>

<i18n lang="yaml" locale="en">
column: 'Sensitive answers were deleted for data protection reasons.'
</i18n>

<i18n lang="yaml" locale="de">
column: 'Sensible Antworten wurden aus Datenschutzgründen gelöscht.'
</i18n>

<i18n lang="yaml" locale="fr">
column: 'Les réponses sensibles ont été supprimées pour des raisons de protection des données.'
</i18n>

<i18n lang="yaml" locale="pl">
column: 'Wrażliwe odpowiedzi zostały usunięte ze względu na ochronę danych.'
</i18n>

<i18n lang="yaml" locale="cs">
column: 'Citlivé odpovědi byly smazány z důvodu ochrany osobních údajů.'
</i18n>
