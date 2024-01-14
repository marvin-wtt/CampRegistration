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

const startAt = computed<Date>(() => {
  return new Date(props.camp.startAt);
});

const endAt = computed<Date>(() => {
  return new Date(props.camp.endAt);
});

const hasBirthDay = computed<boolean>(() => {
  const value = props.props.value;
  if (typeof value !== 'string') {
    return false;
  }
  const birthday = new Date(value);

  return birthday >= startAt.value && birthday <= endAt.value;
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

  const months = startAt.value.getTime() - new Date(value).getTime();
  const years = new Date(months);

  return Math.abs(years.getUTCFullYear() - 1970).toString();
});
</script>

<style scoped></style>
