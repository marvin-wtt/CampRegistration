<template>
  <div class="q-pa-sm q-gutter-sm">
    <q-input
      v-model.number="maxLength"
      :label="t('maxLength.label')"
      :hint="t('maxLength.hint')"
      :rules="[
        (v) =>
          v === undefined || v > 0 || t('maxLength.validation.positiveNumber'),
      ]"
      outlined
      rounded
      clearable
      @clear="() => (maxLength = undefined)"
    />

    <q-toggle
      v-model="showRemaining"
      :label="t('showRemaining.label')"
    />
  </div>
</template>

<script lang="ts" setup>
import type { TableCellOptionsProps } from '@/components/campManagement/table/tableCells/TableCellOptionsProps';
import { useI18n } from 'vue-i18n';
import type { TextOptions } from '@/components/campManagement/table/tableCells/TextOptions';
import { ref, watch } from 'vue';

const { t } = useI18n();

const model = defineModel<TextOptions>();

defineProps<TableCellOptionsProps>();

const maxLength = ref<number | undefined>(model.value?.maxLength);
const showRemaining = ref<boolean>(model.value?.showRemaining ?? true);

watch(
  [maxLength, showRemaining],
  () => {
    model.value = {
      maxLength: maxLength.value,
      showRemaining: showRemaining.value,
    };
  },
  { deep: true },
);
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
maxLength:
  label: 'Max text length'
  hint: 'In characters'
  validation:
    positiveNumber: 'Must be a positive number'
showRemaining:
  label: 'Show remaining text length'
</i18n>

<i18n lang="yaml" locale="de">
maxLength:
  label: 'Maximale Textlänge'
  hint: 'In Zeichen'
  validation:
    positiveNumber: 'Muss eine positive Zahl sein'
showRemaining:
  label: 'Verbleibende Textlänge anzeigen'
</i18n>

<i18n lang="yaml" locale="fr">
maxLength:
  label: 'Longueur maximale du texte'
  hint: 'En caractères'
  validation:
    positiveNumber: 'Doit être un nombre positif'
showRemaining:
  label: 'Afficher la longueur de texte restante'
</i18n>

<i18n lang="yaml" locale="pl">
maxLength:
  label: 'Maksymalna długość tekstu'
  hint: 'W znakach'
  validation:
    positiveNumber: 'Musi być liczbą dodatnią'
showRemaining:
  label: 'Pokaż pozostałą długość tekstu'
</i18n>

<i18n lang="yaml" locale="cs">
maxLength:
  label: 'Maximální délka textu'
  hint: 'V znacích'
  validation:
    positiveNumber: 'Musí být kladné číslo'
showRemaining:
  label: 'Zobrazit zbývající délku textu'
</i18n>
