<template>
  <page-state-handler
    :loading="loading"
    :error="error"
  >
    <program-calendar
      v-if="data"
      :camp="data"
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
import { computed, onMounted, ref } from 'vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import ProgramCalendar from 'components/campManagement/programPlanner/ProgramCalendar.vue';
import { storeToRefs } from 'pinia';
import type { ProgramEvent } from '@camp-registration/common/entities';

const campDetailsStore = useCampDetailsStore();
const { data } = storeToRefs(campDetailsStore);

onMounted(async () => {
  await campDetailsStore.fetchData();
});

const loading = computed<boolean>(() => {
  return campDetailsStore.isLoading;
});

const error = computed<unknown>(() => {
  return campDetailsStore.error;
});

const events = ref<ProgramEvent[]>([
  {
    id: crypto.randomUUID(),
    title: 'Left Test',
    details: 'Full day',
    backgroundColor: 'red',
    side: 'left',
    date: '2024-07-31',
  },
  {
    id: crypto.randomUUID(),
    title: 'Auto test',
    details: 'Full day',
    backgroundColor: 'red',
    side: 'auto',
    date: '2024-08-01',
    time: '10:30',
    duration: 60,
  },
]);

function onEventAdd(event: Omit<ProgramEvent, 'id'>) {
  // TODO Call Store
  events.value.push({
    ...event,
    id: crypto.randomUUID(),
  });
}

function onEventUpdate(id: string, eventUpdate: Partial<ProgramEvent>) {
  // TODO Call Store
  events.value = events.value.map((event) => {
    if (event.id !== id) {
      return event;
    }

    return {
      ...event,
      ...eventUpdate,
    };
  });
}

function onEventDelete(id: string) {
  // TODO Call Store
  events.value = events.value.filter((event) => event.id === id);
}
</script>

<style scoped></style>
