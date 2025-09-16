<template>
  {{ timeAgo }}
  <q-tooltip>
    {{ timestamp }}
  </q-tooltip>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const { props: cellProps } = defineProps<TableCellProps>();
const { t, d } = useI18n();
const timeIntervals = {
  second: 1000,
  minute: 60,
  hour: 60,
  day: 24,
  week: 7,
  month: 365 / 12 / 7,
  year: 12,
};

const timestamp = computed<string | unknown>(() => {
  if (typeof cellProps.value !== 'string') {
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

  const date = new Date(cellProps.value);
  if (isNaN(date.getTime())) {
    return '!';
  }

  const now = new Date();
  let diff = now.getTime() - date.getTime();

  let previous = 'millisecond';
  for (const [name, conversion] of Object.entries(timeIntervals)) {
    if (diff < conversion) {
      return t(previous, Math.floor(diff));
    }

    diff /= conversion;
    previous = name;
  }

  return t(previous, Math.floor(diff));
});
</script>

<i18n lang="yaml" locale="en">
millisecond: '{n} milliseconds ago'
second: '{n} second ago | {n} seconds ago'
minute: '{n} minute ago | {n} minutes ago'
hour: '{n} hour ago | {n} hours ago'
day: '{n} day ago | {n} days ago'
week: '{n} week ago | {n} weeks ago'
month: '{n} month ago | {n} months ago'
year: '{n} year ago | {n} years ago'
</i18n>

<i18n lang="yaml" locale="de">
millisecond: 'vor {n} Millisekunden'
second: 'vor {n} Sekunde | vor {n} Sekunden'
minute: 'vor {n} Minute | vor {n} Minuten'
hour: 'vor {n} Stunde | vor {n} Stunden'
day: 'vor {n} Tag | vor {n} Tagen'
week: 'vor {n} Woche | vor {n} Wochen'
month: 'vor {n} Monat | vor {n} Monaten'
year: 'vor {n} Jahr | vor {n} Jahren'
</i18n>

<i18n lang="yaml" locale="fr">
millisecond: 'Il y a {n} millisecondes'
second: 'Il y a {n} seconde | Il y a {n} secondes'
minute: 'Il y a {n} minute | Il y a {n} minutes'
hour: 'Il y a {n} heure | Il y a {n} heures'
day: 'Il y a {n} jour | Il y a {n} jours'
week: 'Il y a {n} semaine | Il y a {n} semaines'
month: 'Il y a {n} mois | Il y a {n} mois'
year: 'Il y a {n} an | Il y a {n} ans'
</i18n>

<style scoped></style>
