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
        {{ icon.opacity }}
      </q-tooltip>
    </country-icon>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import CountryIcon from 'components/common/localization/CountryIcon.vue';

interface Icon {
  key: string;
  name: string;
  opacity: number;
}

const props = defineProps<TableCellProps>();
const icons = computed<Icon[]>(() => {
  const value = props.props.value;

  if (typeof value !== 'object' || value === null) {
    return [];
  }

  const icons: Icon[] = [];
  for (const [k, v] of Object.entries(value)) {
    icons.push({
      key: k,
      name: `img:flags/${k}.svg`,
      opacity: typeof v === 'number' ? 100 - v : 100,
    });
  }

  return icons;
});

const size = computed<string>(() => {
  return props.props.dense ? 'xs' : 'md';
});
</script>

<style scoped></style>
