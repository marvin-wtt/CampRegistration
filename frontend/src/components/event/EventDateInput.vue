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

const highlight = computed(() => {
  const event = eventDetailsStore.data;
  return event
    ? { start: event.startAt.slice(0, 10), end: event.endAt.slice(0, 10) }
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
