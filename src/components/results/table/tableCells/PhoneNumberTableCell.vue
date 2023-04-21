<template>
  {{ formattedPhoneNumber }}
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';

interface Props {
  props: QTableBodyCellProps;
  options?: object;
  printing: boolean;
}

const props = defineProps<Props>();
const countryCodes = {
  de: 49,
  fr: 33,
  pl: 48,
};

const formattedPhoneNumber = computed<string | unknown>(() => {
  const value = props.props.value;

  if (typeof value !== 'string' && typeof value !== 'number') {
    return value;
  }

  return value
    .toString()
    .split(/[,;]+/g)
    .map((value: string) => formatPhoneNumber(value.trim()))
    .join(', ');
});

function formatPhoneNumber(phoneNumber: string): string {
  if (
    !phoneNumber.match(/^([+0])\d[\d\-\/\s]+$/g) ||
    (!phoneNumber.startsWith('+') && !phoneNumber.startsWith('0'))
  ) {
    return phoneNumber;
  }

  // Replace all special characters
  phoneNumber = phoneNumber.replace(/\s|-|\//g, '');

  if (phoneNumber.startsWith('+')) {
    return formatForCountry(
      phoneNumber.substring(3),
      phoneNumber.substring(1, 3)
    );
  }

  if (phoneNumber.startsWith('00')) {
    return formatForCountry(
      phoneNumber.substring(4),
      phoneNumber.substring(2, 3)
    );
  }

  return formatForCountry(phoneNumber.substring(1), guessCountryCode());
}

function guessCountryCode(): string {
  if (
    !('country' in props.props.row) ||
    typeof props.props.row.country !== 'string'
  ) {
    return '0';
  }

  return props.props.row.country in countryCodes
    ? countryCodes[
        props.props.row.country as keyof typeof countryCodes
      ].toString()
    : '0';
}

function formatForCountry(
  phoneNumber: string,
  countryCode: string | undefined
): string {
  let start = '';
  let end = phoneNumber;

  // First digit separate
  if (countryCode === '33') {
    start = phoneNumber.charAt(0);
    end = phoneNumber.substring(1);
  }

  // First three digits separate
  if (countryCode === '49') {
    start = phoneNumber.substring(0, 3);
    end = phoneNumber.substring(3);
  }

  // Split in chunks of two digits and join seperated by a single space
  const chunks = end.match(/.{1,2}/g) || [];
  end = chunks.join(' ');

  return `+${countryCode} ${start} ${end}`;
}
</script>

<style scoped></style>
