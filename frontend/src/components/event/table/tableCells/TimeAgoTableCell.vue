<template>
  {{ timeAgo }}
  <q-tooltip>
    {{ timestamp }}
  </q-tooltip>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TableCellProps } from '@/components/event/table/tableCells/TableCellProps';

const { props: cellProps } = defineProps<TableCellProps>();
const { t, d, locale } = useI18n();

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const YEAR = 365 * DAY;
const MONTH = YEAR / 12;

// Ordered largest to smallest: the first threshold the diff clears wins the bucket.
const UNIT_THRESHOLDS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', YEAR],
  ['month', MONTH],
  ['week', WEEK],
  ['day', DAY],
  ['hour', HOUR],
  ['minute', MINUTE],
];

const parsedDate = computed<Date | null>(() => {
  if (typeof cellProps.value !== 'string') {
    return null;
  }

  const date = new Date(cellProps.value);
  return isNaN(date.getTime()) ? null : date;
});

const timestamp = computed<unknown>(() => {
  if (typeof cellProps.value !== 'string' || !parsedDate.value) {
    return cellProps.value;
  }

  return d(cellProps.value, {
    dateStyle: 'long',
    timeStyle: 'long',
  });
});

const timeAgo = computed<string>(() => {
  if (typeof cellProps.value !== 'string') {
    return '?';
  }

  if (!parsedDate.value) {
    return '!';
  }

  const secondsFromNow = (parsedDate.value.getTime() - Date.now()) / 1000;

  if (Math.abs(secondsFromNow) < MINUTE) {
    return secondsFromNow < 0 ? t('lessThanMinute') : t('inLessThanMinute');
  }

  const [unit, unitSeconds] = UNIT_THRESHOLDS.find(
    ([, threshold]) => Math.abs(secondsFromNow) >= threshold,
  ) ?? ['minute', MINUTE];

  const rtf = new Intl.RelativeTimeFormat(locale.value, { numeric: 'always' });
  return rtf.format(Math.round(secondsFromNow / unitSeconds), unit);
});
</script>

<i18n lang="yaml" locale="en">
lessThanMinute: 'less than a minute ago'
inLessThanMinute: 'in less than a minute'
</i18n>

<i18n lang="yaml" locale="de">
lessThanMinute: 'vor weniger als einer Minute'
inLessThanMinute: 'in weniger als einer Minute'
</i18n>

<i18n lang="yaml" locale="fr">
lessThanMinute: "Il y a moins d'une minute"
inLessThanMinute: "Dans moins d'une minute"
</i18n>

<i18n lang="yaml" locale="pl">
lessThanMinute: 'mniej niż minutę temu'
inLessThanMinute: 'za mniej niż minutę'
</i18n>

<i18n lang="yaml" locale="cs">
lessThanMinute: 'před méně než minutou'
inLessThanMinute: 'za méně než minutu'
</i18n>

<style scoped></style>
