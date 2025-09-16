<template>
  <div class="q-gutter-x-sm">
    <country-icon
      v-for="icon in icons"
      :key="icon.name"
      :locale="icon.name"
      :size="size"
      :style="`filter: grayscale(${icon.opacity})`"
    >
      <q-tooltip>
        {{ icon.name }}
      </q-tooltip>
    </country-icon>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import CountryIcon from 'components/common/localization/CountryIcon.vue';

interface Icon {
  name: string;
  opacity: number;
}

const { props: cellProps } = defineProps<TableCellProps>();

const icons = computed<Icon[]>(() => {
  const value = cellProps.value;

  if (typeof value !== 'object' || value === null) {
    return [];
  }

  return Object.entries(value)
    .map(([name, value]) => ({
      name,
      opacity: calculateOpacity(value),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

const calculateOpacity = (value: unknown): number => {
  if (!value) {
    return 1;
  }

  if (typeof value === 'object' && 'level' in value) {
    return calculateOpacity(value.level);
  }

  if (typeof value === 'string') {
    return levelToOpacity(value);
  }

  // This is the legacy support
  if (typeof value === 'number') {
    return 100 - value;
  }

  return 100;
};

const levelToOpacity = (level: string): number => {
  level = level.toUpperCase();
  switch (level) {
    case 'C2':
    case 'NATIVE':
    case 'FLUENT':
    case 'MASTERY':
    case 'PROFICIENCY':
      return 0;
    case 'C1':
    case 'ADVANCED':
      return 1 / 6;
    case 'B2':
    case 'VANTAGE':
    case 'UPPER-INTERMEDIATE':
      return 2 / 6;
    case 'B1':
    case 'THRESHOLD':
    case 'INTERMEDIATE':
      return 3 / 6;
    case 'A2':
    case 'PRE-INTERMEDIATE':
    case 'WASTAGE':
    case 'BASIC':
      return 4 / 6;
    case 'A1':
    case 'BEGINNER':
    case 'BREAKTHROUGH':
      return 5 / 6;
    case 'NONE':
    default:
      return 1;
  }
};

const size = computed<string>(() => {
  return cellProps.dense ? 'xs' : 'md';
});
</script>

<style scoped></style>
