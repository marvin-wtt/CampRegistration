<template>
  <div
    class="cal-day-event cursor-pointer"
    :style="badgeStyles"
    @dragstart="onDragStart"
    @dragend="isDragging = false"
  >
    <q-icon
      v-if="viewBoth && event.plan !== 'both'"
      :name="event.plan === 'a' ? 'wb_sunny' : 'water_drop'"
      size="10px"
      class="q-mr-xs"
    />
    <span class="cal-day-event__title q-calendar__ellipsis">
      {{ to(event.title) }}
    </span>

    <calendar-item-popup
      :event="props.event"
      @edit="emit('edit')"
      @delete="emit('delete')"
      @duplicate="emit('duplicate')"
    />
  </div>
</template>

<script lang="ts" setup>
import type { ProgramEvent } from '@camp-registration/common/entities';
import { computed, ref, type StyleValue } from 'vue';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import CalendarItemPopup from 'components/campManagement/programPlanner/CalendarItemPopup.vue';

const props = defineProps<{
  event: ProgramEvent;
  viewBoth?: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'delete'): void;
  (e: 'duplicate'): void;
}>();

const { to } = useObjectTranslation();

const isDragging = ref(false);
const isCopyDrag = ref(false);

function onDragStart(e: DragEvent) {
  isCopyDrag.value = e.ctrlKey || e.metaKey;

  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Control' || ev.key === 'Meta') isCopyDrag.value = true;
  };
  const onKeyUp = (ev: KeyboardEvent) => {
    if (ev.key === 'Control' || ev.key === 'Meta') isCopyDrag.value = false;
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  setTimeout(() => {
    isDragging.value = true;
  }, 0);

  const cleanup = () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('dragend', cleanup);
  };
  document.addEventListener('dragend', cleanup);
}

const badgeStyles = computed<StyleValue>(() => ({
  backgroundColor: props.event.color ?? '#2196F3',
  borderLeft: `3px solid rgba(0,0,0,0.2)`,
  opacity: isDragging.value && !isCopyDrag.value ? 0 : undefined,
  pointerEvents: isDragging.value ? 'none' : undefined,
}));
</script>

<style lang="scss" scoped>
.cal-day-event {
  display: flex;
  align-items: center;
  border-radius: 3px;
  padding: 2px 6px;
  margin: 1px 2px;
  overflow: hidden;

  &__title {
    font-size: 12px;
    font-weight: 600;
    color: white;
    line-height: 1.4;
  }
}
</style>
