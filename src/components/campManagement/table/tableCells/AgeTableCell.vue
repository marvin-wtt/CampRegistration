<template>
  <span>
    {{ age }}

    <q-tooltip>
      {{ birthday }}
    </q-tooltip>
  </span>

  <!-- Special badge if birthday during time period -->
  <q-badge
    v-if="hasBirthDay"
    color="transparent"
    floating
  >
    <q-icon
      color="red"
      name="cake"
    />
  </q-badge>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const props = defineProps<TableCellProps>();
const { d } = useI18n();

const startDate = computed<Date>(() => {
  // TODO How get start end end date from store?
  return new Date('2023-07-29');
});

const hasBirthDay = computed<boolean>(() => {
  // TODO How get start end end date from store?
  return false;
});

const birthday = computed<string>(() => {
  const value = props.props.value;

  if (typeof value !== 'string') {
    return 'Invalid';
  }

  return d(value);
});

const age = computed<string>(() => {
  const value = props.props.value;
  if (typeof value !== 'string') {
    return 'Invalid';
  }

  // TODO Use camp start date as reference
  const months = startDate.value.getTime() - new Date(value).getTime();
  const years = new Date(months);

  return Math.abs(years.getUTCFullYear() - 1970).toString();
});
</script>

<style scoped></style>
