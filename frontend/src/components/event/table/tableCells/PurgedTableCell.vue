<template>
  <!-- Printers often drop backgrounds; italics and a dashed border survive. -->
  <span
    v-if="printing"
    class="purged-print"
  >
    — {{ t('value') }} —
  </span>
  <q-chip
    v-else
    :dense="!gridMode"
    color="surface-container-highest"
    text-color="on-surface-variant"
    icon="auto_delete"
    class="purged-chip q-ma-none"
    data-test="purged-cell"
  >
    {{ t('value') }}
    <q-tooltip>{{ t('reason') }}</q-tooltip>
  </q-chip>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import type { TableCellProps } from '@/components/event/table/tableCells/TableCellProps';

// Stands in for any renderer on a column whose answers were deleted, so a
// deleted value never reads like an empty answer (docs/privacy.md, 8).
const { printing, gridMode = false } = defineProps<TableCellProps>();

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.purged-chip {
  font-style: italic;
  border: 1px dashed var(--md3-outline);
  user-select: none;
}

.purged-print {
  font-style: italic;
  white-space: nowrap;
  border: 1px dashed currentColor;
  padding: 0 0.25em;
}
</style>

<i18n lang="yaml" locale="en">
value: 'Deleted'
reason: 'Deleted for data protection reasons'
</i18n>

<i18n lang="yaml" locale="de">
value: 'Gelöscht'
reason: 'Aus Datenschutzgründen gelöscht'
</i18n>

<i18n lang="yaml" locale="fr">
value: 'Supprimé'
reason: 'Supprimé pour des raisons de protection des données'
</i18n>

<i18n lang="yaml" locale="pl">
value: 'Usunięto'
reason: 'Usunięto ze względu na ochronę danych'
</i18n>

<i18n lang="yaml" locale="cs">
value: 'Smazáno'
reason: 'Smazáno z důvodu ochrany osobních údajů'
</i18n>
