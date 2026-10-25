<template>
  {{ formattedPhoneNumber }}

  <q-tooltip v-if="formattedPhoneNumber">
    {{ cellProps.value }}
  </q-tooltip>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellProps } from '@/components/event/table/tableCells/TableCellProps';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { formatPhoneNumber } from '@/utils/formatPhoneNumber';
import type { Registration } from '@camp-registration/common/entities';

const { props: cellProps, event } = defineProps<TableCellProps>();
const registrationHelper = useRegistrationHelper();

const registration = computed<Registration>(() => {
  return cellProps.row;
});

const formattedPhoneNumber = computed<unknown>(() => {
  const value = cellProps.value;

  if (typeof value !== 'string' && typeof value !== 'number') {
    return value;
  }

  return formatPhoneNumber(value.toString(), {
    country: registrationHelper.country(registration.value),
    eventCountries: event.countries,
  });
});
</script>

<style scoped></style>
