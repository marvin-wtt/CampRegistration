<template>
  <country-icon
    v-if="country !== undefined"
    :locale="country"
    :size="size"
  />

  <a v-else>
    {{ props.props.value }}
  </a>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import CountryIcon from 'components/common/localization/CountryIcon.vue';

const props = defineProps<TableCellProps>();

const country = computed<string | undefined>(() => {
  return typeof props.props.value === 'string' ? props.props.value : undefined;
});

const size = computed<string>(() => {
  return props.props.dense ? 'xs' : 'md';
});
</script>

<style scoped></style>
