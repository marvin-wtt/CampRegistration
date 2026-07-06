<template>
  <div class="q-pa-sm q-gutter-sm">
    <q-toggle
      v-model="showBirthday"
      :label="t('showBirthday.label')"
    />
  </div>
</template>

<script lang="ts" setup>
import type { TableCellOptionsProps } from '@/components/campManagement/table/tableCells/TableCellOptionsProps';
import { useI18n } from 'vue-i18n';
import type { AgeOptions } from '@/components/campManagement/table/tableCells/AgeOptions';
import { ref, watch } from 'vue';

const { t } = useI18n();

const model = defineModel<AgeOptions>();

defineProps<TableCellOptionsProps>();

const showBirthday = ref<boolean>(model.value?.showBirthday ?? true);

watch(
  [showBirthday],
  () => {
    model.value = {
      showBirthday: showBirthday.value,
    };
  },
  { deep: true },
);
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
showBirthday:
  label: 'Highlight birthdays'
</i18n>

<i18n lang="yaml" locale="de">
showBirthday:
  label: 'Geburtstage hervorheben'
</i18n>

<i18n lang="yaml" locale="fr">
showBirthday:
  label: 'Mettre en surbrillance les anniversaires'
</i18n>

<i18n lang="yaml" locale="pl">
showBirthday:
  label: 'Podświetl urodziny'
</i18n>

<i18n lang="yaml" locale="cs">
showBirthday:
  label: 'Zvýraznit narozeniny'
</i18n>
