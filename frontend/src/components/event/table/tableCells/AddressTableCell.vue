<template>
  {{ address }}
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellProps } from '@/components/event/table/tableCells/TableCellProps';
import { useI18n } from 'vue-i18n';
import { formatAddress } from '@/utils/formatAddress';

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te } = useI18n();

const { props: cellProps } = defineProps<TableCellProps>();

const address = computed<string>(() => {
  const translateCountry = (country: string): string => {
    const key = `country.${country}`;
    return te(key) ? t(key) : country;
  };

  return formatAddress(cellProps.value, translateCountry);
});
</script>

<style scoped></style>
