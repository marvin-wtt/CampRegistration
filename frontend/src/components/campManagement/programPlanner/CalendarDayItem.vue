<template>
  <div
    class="text-center rounded-borders cursor-pointer"
    :style="badgeStyles"
  >
    <q-icon
      v-if="viewBoth && event.plan !== 'both'"
      :name="event.plan === 'a' ? 'wb_sunny' : 'water_drop'"
      size="xs"
      class="q-mr-xs"
    />
    {{ to(event.title) }}

    <calendar-item-popup
      :event="props.event"
      @edit="onEdit"
      @delete="onDelete"
    />
  </div>
</template>

<script lang="ts" setup>
import type { ProgramEvent } from '@camp-registration/common/entities';
import { computed, type StyleValue } from 'vue';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import CalendarItemPopup from 'components/campManagement/programPlanner/CalendarItemPopup.vue';

const props = defineProps<{
  event: ProgramEvent;
  viewBoth?: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'delete'): void;
}>();

const { to } = useObjectTranslation();

const backgroundColor = computed<string>(() => {
  return props.event.color ?? '#0000ff';
});

const badgeStyles = computed<StyleValue>(() => {
  return {
    backgroundColor: backgroundColor.value,
  };
});

function onDelete() {
  emit('delete');
}

function onEdit() {
  emit('edit');
}
</script>

<style scoped></style>
