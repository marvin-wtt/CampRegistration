<template>
  <div
    class="text-center rounded-borders cursor-pointer"
    :style="badgeStyles"
  >
    {{ to(event.title) }}

    <calendar-item-popup :event="props.event" />

    <calendar-item-popup
      :event="props.event"
      @edit="onEdit"
      @delete="onDelete"
    />
  </div>
</template>

<script lang="ts" setup>
import type { ProgramEvent } from '@camp-registration/common/entities';
import { computed, StyleValue } from 'vue';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import CalendarItemPopup from 'components/campManagement/programPlanner/CalendarItemPopup.vue';

const props = defineProps<{
  event: ProgramEvent;
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
