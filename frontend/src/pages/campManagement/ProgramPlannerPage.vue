<template>
  <page-state-handler
    :loading="loading"
    :error="error"
  >
    <program-calendar
      v-if="camp && events"
      :camp="camp"
      :events="events"
      class="absolute fit"
      @add="onEventAdd"
      @update="onEventUpdate"
      @delete="onEventDelete"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { computed, onMounted } from 'vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import ProgramCalendar from 'components/campManagement/programPlanner/ProgramCalendar.vue';
import { storeToRefs } from 'pinia';
import type {
  ProgramEvent,
  ProgramEventCreateData,
} from '@camp-registration/common/entities';
import { useProgramPlannerStore } from 'stores/program-planner-store';

const programPlannerStore = useProgramPlannerStore();
const { data: events } = storeToRefs(programPlannerStore);
const campDetailsStore = useCampDetailsStore();
const { data: camp } = storeToRefs(campDetailsStore);

onMounted(async () => {
  await campDetailsStore.fetchData();
});

const loading = computed<boolean>(() => {
  return campDetailsStore.isLoading || programPlannerStore.isLoading;
});

const error = computed<unknown>(() => {
  return campDetailsStore.error ?? programPlannerStore.error;
});

function onEventAdd(event: ProgramEventCreateData) {
  programPlannerStore.createEntry(event);
}

function onEventUpdate(id: string, eventUpdate: Partial<ProgramEvent>) {
  programPlannerStore.updateEntry(id, eventUpdate);
}

function onEventDelete(id: string) {
  programPlannerStore.deleteEntry(id);
}
</script>

<style scoped></style>
