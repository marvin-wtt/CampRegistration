<template>
  <span>{{ text }}</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RetentionDeadline } from '@camp-registration/common/privacy';

// What a deadline says about its date: deleted on, postponed until, or due by;
// `fallback` where there is no deadline yet.
const { deadline, purgedAt, fallback } = defineProps<{
  deadline: RetentionDeadline | null;
  purgedAt?: string | null | undefined;
  fallback?: string | undefined;
}>();

const { t, d } = useI18n();

const text = computed(() => {
  const deleted = purgedAt ?? deadline?.resolvedAt ?? null;
  if (deleted) {
    return t('date.deleted', { date: d(deleted, 'date') });
  }
  if (deadline?.postponement) {
    return t('date.postponed', {
      date: d(deadline.postponement.until, 'date'),
      original: d(deadline.dueAt, 'date'),
    });
  }
  if (deadline) {
    return t('date.due', { date: d(deadline.dueAt, 'date') });
  }
  return fallback ?? '';
});
</script>

<i18n lang="yaml" locale="en">
date:
  due: 'Delete by {date}'
  postponed: 'Postponed until {date} (originally {original})'
  deleted: 'Deleted on {date}'
</i18n>

<i18n lang="yaml" locale="de">
date:
  due: 'Löschen bis {date}'
  postponed: 'Verschoben auf {date} (ursprünglich {original})'
  deleted: 'Gelöscht am {date}'
</i18n>

<i18n lang="yaml" locale="fr">
date:
  due: 'À supprimer avant le {date}'
  postponed: 'Reporté au {date} (initialement {original})'
  deleted: 'Supprimé le {date}'
</i18n>

<i18n lang="yaml" locale="pl">
date:
  due: 'Usunąć do {date}'
  postponed: 'Przesunięto na {date} (pierwotnie {original})'
  deleted: 'Usunięto {date}'
</i18n>

<i18n lang="yaml" locale="cs">
date:
  due: 'Smazat do {date}'
  postponed: 'Odloženo na {date} (původně {original})'
  deleted: 'Smazáno {date}'
</i18n>
