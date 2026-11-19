<template>
  <!-- A retention deadline's status, coloured by its MD3 role. -->
  <q-chip
    dense
    square
    class="retention-status"
    :color="ROLES[status].color"
    :text-color="ROLES[status].textColor"
    :label="
      postponed
        ? `${t(`status.${status}`)} · ${t('postponed')}`
        : t(`status.${status}`)
    "
  />
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import type { RetentionDeadlineStatus } from '@camp-registration/common/privacy';

defineProps<{
  status: RetentionDeadlineStatus;
  /** Adds "postponed" where the date shown is not what was promised. */
  postponed?: boolean;
}>();

const { t } = useI18n();

const ROLES: Record<
  RetentionDeadlineStatus,
  { color: string; textColor: string }
> = {
  upcoming: {
    color: 'surface-container-highest',
    textColor: 'on-surface-variant',
  },
  due_soon: { color: 'warning-container', textColor: 'on-warning-container' },
  overdue: { color: 'error-container', textColor: 'on-error-container' },
  resolved: {
    color: 'positive-container',
    textColor: 'on-positive-container',
  },
};
</script>

<style scoped>
.retention-status {
  margin: 0;
}
</style>

<i18n lang="yaml" locale="en">
status:
  upcoming: 'Upcoming'
  due_soon: 'Due soon'
  overdue: 'Overdue'
  resolved: 'Deleted'
postponed: 'postponed'
</i18n>

<i18n lang="yaml" locale="de">
status:
  upcoming: 'Anstehend'
  due_soon: 'Bald fällig'
  overdue: 'Überfällig'
  resolved: 'Gelöscht'
postponed: 'verschoben'
</i18n>

<i18n lang="yaml" locale="fr">
status:
  upcoming: 'À venir'
  due_soon: 'Bientôt'
  overdue: 'En retard'
  resolved: 'Supprimé'
postponed: 'reporté'
</i18n>

<i18n lang="yaml" locale="pl">
status:
  upcoming: 'Nadchodzący'
  due_soon: 'Wkrótce'
  overdue: 'Po terminie'
  resolved: 'Usunięte'
postponed: 'przesunięty'
</i18n>

<i18n lang="yaml" locale="cs">
status:
  upcoming: 'Nadcházející'
  due_soon: 'Brzy'
  overdue: 'Po lhůtě'
  resolved: 'Smazáno'
postponed: 'odloženo'
</i18n>
