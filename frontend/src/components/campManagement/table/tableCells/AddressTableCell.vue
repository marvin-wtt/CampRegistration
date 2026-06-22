<template>
  {{ address }}
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import { useI18n } from 'vue-i18n';

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te } = useI18n();

const { props: cellProps } = defineProps<TableCellProps>();

const address = computed<string>(() => {
  const value = cellProps.value;
  if (typeof value === 'string') {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  const field = (key: string): string | undefined => {
    const raw = (value as Record<string, unknown>)[key];

    return typeof raw === 'string' && raw.trim() !== '' ? raw : undefined;
  };

  const translateCountry = (country: string): string => {
    const key = `country.${country}`;
    return te(key) ? t(key) : country;
  };

  // The street is either a single combined field or a street name plus an
  // optional house number.
  const street = field('address') ?? join(' ', field('street'), field('nr'));

  // The locality combines the postal code (snake_case or camelCase) and city.
  const locality = join(
    ' ',
    field('zip_code') ?? field('zipCode'),
    field('city'),
  );

  const country = field('country');

  // Comma-separate the present segments so we never emit a stray comma or
  // double separator for missing fields.
  return join(
    ', ',
    street,
    locality,
    country ? translateCountry(country) : undefined,
  );
});

// Joins the defined, non-empty parts with the given separator.
function join(separator: string, ...parts: (string | undefined)[]): string {
  return parts.filter((part) => part).join(separator);
}
</script>

<style scoped></style>
