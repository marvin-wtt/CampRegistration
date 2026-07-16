<template>
  <div
    class="cal-day-event cursor-pointer"
    :class="{ 'cal-day-event--selected': selected }"
    :style="badgeStyles"
    @click="onClick"
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
      {{ showAllTranslations ? toAll(event.title) : to(event.title) }}
    </span>

    <calendar-item-popup
      ref="popupRef"
      :event="event"
      :editable="editable"
      :deletable="deletable"
      :creatable="creatable"
      no-parent-event
      @edit="emit('edit')"
      @delete="emit('delete')"
      @duplicate="emit('duplicate')"
      @move-to-backlog="emit('move-to-backlog')"
    />
  </div>
</template>

<script lang="ts" setup>
import type { ProgramEvent } from '@camp-registration/common/entities';
import { computed, ref, type StyleValue } from 'vue';
import { useObjectTranslation } from '@/composables/objectTranslation';
import CalendarItemPopup from '@/components/campManagement/programPlanner/CalendarItemPopup.vue';

const {
  event,
  viewBoth,
  showAllTranslations,
  selected = false,
  dimmed = false,
  editable = false,
  deletable = false,
  creatable = false,
} = defineProps<{
  event: ProgramEvent;
  viewBoth?: boolean;
  showAllTranslations?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  editable?: boolean;
  deletable?: boolean;
  creatable?: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'delete'): void;
  (e: 'duplicate'): void;
  (e: 'move-to-backlog'): void;
}>();

const { to, toAll } = useObjectTranslation();

const isDragging = ref(false);
const isCopyDrag = ref(false);

const popupRef = ref<InstanceType<typeof CalendarItemPopup> | null>(null);

// Ctrl/cmd-click is the multi-select gesture — don't also pop open the
// event's detail/actions menu while the user is building a selection.
function onClick(e: MouseEvent) {
  if (e.ctrlKey || e.metaKey) {
    return;
  }
  popupRef.value?.show(e);
}

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
  backgroundColor: event.color ?? '#2196F3',
  borderLeft: `3px solid rgba(0,0,0,0.2)`,
  opacity: (isDragging.value && !isCopyDrag.value) || dimmed ? 0 : undefined,
  pointerEvents: isDragging.value || dimmed ? 'none' : undefined,
}));
</script>

<style lang="scss" scoped>
.cal-day-event {
  display: flex;
  align-items: center;
  border-radius: 6px;
  padding: 2px 6px;
  margin: 2px 2px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  transition: box-shadow 0.15s cubic-bezier(0.2, 0, 0, 1);

  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  }

  &--selected {
    // Two-tone ring: surface-colored gap keeps the primary ring visible
    // regardless of the user-chosen event color
    box-shadow:
      0 0 0 2px var(--md3-surface),
      0 0 0 4px var(--md3-primary);

    // `:hover` alone has higher specificity than `--selected` alone (two
    // simple selectors vs. one), so it would otherwise clobber the ring —
    // re-assert it here, layered with the hover elevation.
    &:hover {
      box-shadow:
        0 0 0 2px var(--md3-surface),
        0 0 0 4px var(--md3-primary),
        0 2px 6px rgba(0, 0, 0, 0.25);
    }
  }

  &__title {
    font-size: 12px;
    font-weight: 600;
    color: white;
    line-height: 1.4;
  }
}
</style>
