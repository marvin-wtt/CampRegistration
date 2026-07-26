<template>
  <div
    v-if="event.time"
    class="cal-event"
    :class="{ 'cal-event--selected': selected }"
    :style="badgeStyles"
    @click="onClick"
    @dragstart="onDragStart"
    @dragend="isDragging = false"
  >
    <div class="cal-event__inner">
      <div class="cal-event__title q-calendar__ellipsis">
        {{ showAllTranslations ? toAll(event.title) : to(event.title) }}
      </div>
    </div>

    <div
      v-if="editable"
      class="cal-event__resize-handle"
      @mousedown.stop.prevent="startResize"
    />

    <!-- Horizontal handles change the plan an event belongs to. Only the edge
         facing the column midline is grabbable — the outer edge of a half (or
         of a full-width event) has nowhere to go. -->
    <div
      v-if="planResizable && event.plan !== 'a'"
      class="cal-event__plan-handle cal-event__plan-handle--left"
      @mousedown.stop.prevent="(e) => startPlanResize(e, 'left')"
    />
    <div
      v-if="planResizable && event.plan !== 'b'"
      class="cal-event__plan-handle cal-event__plan-handle--right"
      @mousedown.stop.prevent="(e) => startPlanResize(e, 'right')"
    />

    <calendar-item-popup
      ref="popup"
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
import { computed, ref, type StyleValue, useTemplateRef } from 'vue';
import { useObjectTranslation } from '@/composables/objectTranslation';
import CalendarItemPopup from '@/components/campManagement/programPlanner/CalendarItemPopup.vue';

const {
  event,
  viewBoth = false,
  showAllTranslations = false,
  selected = false,
  dimmed = false,
  editable = false,
  deletable = false,
  creatable = false,
  timeDurationHeight,
  timeStartPosition,
  snap,
} = defineProps<{
  event: ProgramEvent;
  viewBoth?: boolean;
  showAllTranslations?: boolean;
  selected?: boolean;
  // True while another event in the same drag group is being dragged —
  // this one is hidden in favor of its drop preview box.
  dimmed?: boolean;
  editable?: boolean;
  deletable?: boolean;
  creatable?: boolean;
  timeStartPosition: (time?: string) => number;
  timeDurationHeight: (duration?: number) => number;
  snap?: number;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'delete'): void;
  (e: 'duplicate'): void;
  (e: 'move-to-backlog'): void;
  (e: 'resize', duration: number): void;
  (e: 'change-plan', plan: ProgramEvent['plan']): void;
}>();

const { to, toAll } = useObjectTranslation();

const resizeDuration = ref<number | null>(null);
const resizePlan = ref<ProgramEvent['plan'] | null>(null);
const isDragging = ref(false);
const isCopyDrag = ref(false);

const popupRef =
  useTemplateRef<InstanceType<typeof CalendarItemPopup>>('popup');

// Ctrl/cmd-click is the multi-select gesture — don't also pop open the
// event's detail/actions menu while the user is building a selection.
function onClick(e: MouseEvent) {
  if (e.ctrlKey || e.metaKey) {
    return;
  }
  popupRef.value?.show(e);
}

function onDragStart(e: DragEvent) {
  if (e.dataTransfer && e.currentTarget instanceof HTMLElement) {
    const rect = e.currentTarget.getBoundingClientRect();

    const grabX = e.clientX - rect.left;
    const grabY = e.clientY - rect.top;

    // Always store grab offset so the drop handler and preview can adjust position
    const pixelsPerMinute = timeDurationHeight(60) / 60;
    const grabOffsetMinutes = Math.round(grabY / pixelsPerMinute);
    e.dataTransfer.setData('text/grab-offset', String(grabOffsetMinutes));

    const ghost = document.createElement('div');
    ghost.textContent = to(event.title);
    Object.assign(ghost.style, {
      position: 'fixed',
      top: '-9999px',
      left: '-9999px',
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      backgroundColor: event.color ?? '#2196F3',
      borderLeft: '3px solid rgba(0,0,0,0.2)',
      borderRadius: '6px',
      color: 'white',
      fontSize: '13px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: '2px 4px',
      boxSizing: 'border-box',
      boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
      pointerEvents: 'none',
    });
    document.body.appendChild(ghost);
    // Anchor ghost at the grab point so the event appears to move with the cursor
    e.dataTransfer.setDragImage(ghost, grabX, grabY);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }

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

// Moving an event between plans is only meaningful while both plans are shown
// side by side — in a single-plan view there is no other half to drag into.
const planResizable = computed<boolean>(() => editable && viewBoth);

const badgeStyles = computed<StyleValue>(() => {
  const top = event.time ? timeStartPosition(event.time) + 'px' : undefined;

  const dur = resizeDuration.value ?? event.duration;
  const height = dur ? `calc(${timeDurationHeight(dur)}px - 2px)` : undefined;

  const plan = resizePlan.value ?? event.plan;
  let left = '0';
  let width = 'calc(100% - 4px)';

  if (viewBoth && plan !== 'both') {
    width = 'calc(50% - 4px)';
    if (plan === 'b') {
      left = '50%';
    }
  }

  return {
    backgroundColor: event.color ?? '#2196F3',
    top,
    height,
    left,
    width,
    opacity: (isDragging.value && !isCopyDrag.value) || dimmed ? 0 : undefined,
    pointerEvents: isDragging.value || dimmed ? 'none' : undefined,
  };
});

function startResize(e: MouseEvent) {
  if (!timeDurationHeight || !event.duration) {
    return;
  }

  const startY = e.clientY;
  const startDuration = event.duration;
  const pixelsPerMinute = timeDurationHeight(60) / 60;
  const snapTo = snap ?? 15;

  function onMove(ev: MouseEvent) {
    const deltaMinutes = (ev.clientY - startY) / pixelsPerMinute;
    const raw = startDuration + deltaMinutes;
    resizeDuration.value = Math.max(snapTo, Math.round(raw / snapTo) * snapTo);
  }

  function onUp(ev: MouseEvent) {
    const deltaMinutes = (ev.clientY - startY) / pixelsPerMinute;
    const raw = startDuration + deltaMinutes;
    const final = Math.max(snapTo, Math.round(raw / snapTo) * snapTo);
    emit('resize', final);
    resizeDuration.value = null;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  }

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

// Dragging a vertical edge across the column midline moves the event between
// plans. The edge opposite the dragged one is always pinned to the outer edge
// of the column, so which half the pointer is in fully determines the result:
//   right edge → right half means it now spans both plans, left half means a
//   left edge  → left half means it now spans both plans, right half means b
function startPlanResize(e: MouseEvent, side: 'left' | 'right') {
  if (!(e.currentTarget instanceof HTMLElement)) {
    return;
  }
  const column = e.currentTarget.closest('.q-calendar-day__day');
  if (!column) {
    return;
  }

  const rect = column.getBoundingClientRect();
  const midX = rect.left + rect.width / 2;

  const planAt = (clientX: number): ProgramEvent['plan'] => {
    const inLeftHalf = clientX < midX;
    if (side === 'right') {
      return inLeftHalf ? 'a' : 'both';
    }
    return inLeftHalf ? 'both' : 'b';
  };

  function onMove(ev: MouseEvent) {
    resizePlan.value = planAt(ev.clientX);
  }

  function onUp(ev: MouseEvent) {
    const plan = planAt(ev.clientX);
    resizePlan.value = null;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);

    if (plan !== event.plan) {
      emit('change-plan', plan);
    }
  }

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}
</script>

<style lang="scss" scoped>
.cal-event {
  position: absolute;
  margin: 1px 2px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border-left: 3px solid rgba(0, 0, 0, 0.2);
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

  &__inner {
    padding: 2px 4px;
    height: calc(100% - 2px);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: white;
    line-height: 1.3;
    text-align: center;
  }

  &__resize-handle {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 8px;
    cursor: ns-resize;
    opacity: 0;
    transition: opacity 0.15s ease;

    // Centered grip pill instead of a full-width dark strip
    &::after {
      content: '';
      position: absolute;
      bottom: 2px;
      left: 50%;
      transform: translateX(-50%);
      width: 24px;
      height: 3px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.35);
    }

    @media (hover: none) {
      display: none;
    }
  }

  &__plan-handle {
    position: absolute;
    top: 0;
    // Stop above the duration handle so the two never fight over a corner
    bottom: 8px;
    width: 8px;
    cursor: ew-resize;
    opacity: 0;
    transition: opacity 0.15s ease;

    // Centered grip pill, vertical counterpart of the duration handle's
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 24px;
      max-height: 100%;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.35);
    }

    &--left {
      left: 0;

      &::after {
        left: 2px;
      }
    }

    &--right {
      right: 0;

      &::after {
        right: 2px;
      }
    }

    @media (hover: none) {
      display: none;
    }
  }

  &:hover &__resize-handle,
  &:hover &__plan-handle {
    opacity: 1;
  }
}
</style>
