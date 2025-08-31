<template>
  {{ formattedPhoneNumber }}

  <q-tooltip v-if="formattedPhoneNumber">
    {{ props.value }}
  </q-tooltip>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import parsePhoneNumber, { isSupportedCountry } from 'libphonenumber-js';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import { useRegistrationHelper } from 'src/composables/registrationHelper';
import type { Registration } from '@camp-registration/common/entities';

const { props, camp } = defineProps<TableCellProps>();
const registrationHelper = useRegistrationHelper();

const registration = computed<Registration>(() => {
  return props.row;
});

const formattedPhoneNumber = computed<string | unknown>(() => {
  const value = props.value;

  if (typeof value !== 'string' && typeof value !== 'number') {
    return value;
  }

  // If the camp has only one country, use that country as fallback
  const country =
    (registrationHelper.country(registration.value) ??
    camp.countries.length === 1)
      ? camp.countries[0]
      : undefined;

  const countryCode =
    country && isSupportedCountry(country) ? country : undefined;

  return value
    .toString()
    .split(/[,;]+/g)
    .map(
      (value: string) =>
        parsePhoneNumber(value.trim(), countryCode)?.formatInternational() ??
        value,
    )
    .join(', ');
});
</script>

<style scoped></style>
