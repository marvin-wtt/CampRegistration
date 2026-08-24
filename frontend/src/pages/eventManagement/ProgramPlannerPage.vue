<template>
  <page-state-handler
    :loading="loading"
    :error="error"
  >
    <program-calendar
      v-if="event && events"
      :event="event"
      :events="events"
      class="absolute fit"
      @add="onEventAdd"
      @update="onEventUpdate"
      @delete="onEventDelete"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { computed, onMounted } from 'vue';
import { useEventDetailsStore } from '@/stores/event-details-store';
import ProgramCalendar from '@/components/eventManagement/programPlanner/ProgramCalendar.vue';
import { storeToRefs } from 'pinia';
import type {
  ProgramItemCreateData,
  ProgramItemUpdateData,
} from '@camp-registration/common/entities';
import { useProgramPlannerStore } from '@/stores/program-planner-store';

const programPlannerStore = useProgramPlannerStore();
const { data: events } = storeToRefs(programPlannerStore);
const eventDetailsStore = useEventDetailsStore();
const { data: event } = storeToRefs(eventDetailsStore);

onMounted(async () => {
  await eventDetailsStore.fetchData();
  await programPlannerStore.fetchData();
});

const loading = computed<boolean>(() => {
  return eventDetailsStore.isLoading || programPlannerStore.isLoading;
});

const error = computed(() => {
  return eventDetailsStore.error ?? programPlannerStore.error;
});

async function onEventAdd(event: ProgramItemCreateData) {
  await programPlannerStore.createEntry(event);
}

async function onEventUpdate(id: string, eventUpdate: ProgramItemUpdateData) {
  await programPlannerStore.updateEntry(id, eventUpdate);
}

async function onEventDelete(id: string) {
  await programPlannerStore.deleteEntry(id);
}
</script>

<style scoped></style>
