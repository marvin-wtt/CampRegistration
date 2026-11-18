<template>
  <!-- The shared date field with the open event's days marked. -->
  <date-input
    v-model="model"
    v-bind="props"
    :highlight
    :highlight-label="t('eventDays')"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import DateInput from '@/components/common/inputs/DateInput.vue';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { isoToLocalDate } from '@/utils/date';

const props = defineProps<{
  label: string;
  hint?: string | undefined;
  clearable?: boolean;
  min?: string | undefined;
  max?: string | undefined;
  openOnToday?: boolean;
}>();

const model = defineModel<string | null | undefined>();

const { t } = useI18n();
const eventDetailsStore = useEventDetailsStore();

// Local days, like the planners' bounds: midnight in Berlin is the day
// before in UTC.
const highlight = computed(() => {
  const event = eventDetailsStore.data;
  return event
    ? { start: isoToLocalDate(event.startAt), end: isoToLocalDate(event.endAt) }
    : undefined;
});
</script>

<i18n lang="yaml" locale="en">
eventDays: 'Event days'
</i18n>

<i18n lang="yaml" locale="de">
eventDays: 'Veranstaltungstage'
</i18n>

<i18n lang="yaml" locale="fr">
eventDays: 'Jours de l’événement'
</i18n>

<i18n lang="yaml" locale="pl">
eventDays: 'Dni wydarzenia'
</i18n>

<i18n lang="yaml" locale="cs">
eventDays: 'Dny akce'
</i18n>
