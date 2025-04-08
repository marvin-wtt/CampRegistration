<template>
  {{ formattedPhoneNumber }}

  <q-tooltip v-if="formattedPhoneNumber">
    {{ props.props.value }}
  </q-tooltip>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { formatPhoneNumber } from 'src/utils/formatters';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import { useRegistrationHelper } from 'src/composables/registrationHelper';
import type { Registration } from '@camp-registration/common/entities';

const props = defineProps<TableCellProps>();
const registrationHelper = useRegistrationHelper();

const registration = computed<Registration>(() => {
  return props.props.row as Registration;
});

const formattedPhoneNumber = computed<string | unknown>(() => {
  const value = props.props.value;

  if (typeof value !== 'string' && typeof value !== 'number') {
    return value;
  }

  const country = registrationHelper.country(registration.value);

  return value
    .toString()
    .split(/[,;]+/g)
    .map((value: string) => formatPhoneNumber(value.trim(), country))
    .join(', ');
});
</script>

<style scoped></style>
