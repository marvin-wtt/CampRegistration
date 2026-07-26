<template>
  <div
    v-if="event.time"
    class="cal-event"
    :class="{
      'cal-event--selected': selected,
      'cal-event--stacked': depth > 0,
    }"
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
  durationOverride,
  planOverride,
  depth = 0,
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
  // Live values while a resize is in flight. A resize acts on the whole
  // selection, so the parent owns the preview for every affected event —
  // including this one, even when it is the one being dragged.
  durationOverride?: number | undefined;
  planOverride?: ProgramEvent['plan'] | undefined;
  // How many events in the same span this one is stacked on top of
  depth?: number;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'delete'): void;
  (e: 'duplicate'): void;
  (e: 'move-to-backlog'): void;
  // `preview` is true for the continuous updates during the drag and false on
  // the final one, which is the only that gets persisted.
  (e: 'resize', deltaMinutes: number, preview: boolean): void;
  (e: 'change-plan', plan: ProgramEvent['plan'], preview: boolean): void;
}>();

const { to, toAll } = useObjectTranslation();

const isDragging = ref(false);
const isCopyDrag = ref(false);

const popupRef =
  useTemplateRef<InstanceType<typeof CalendarItemPopup>>('popup');

// The mouseup ending a resize makes the browser dispatch a click on whatever
// ancestor both ends of the gesture share — the event block itself (opening
// the detail popup) or the day column (clearing the selection). Swallow that
// one click in the capture phase, before any of those handlers see it.
function suppressNextClick() {
  const swallow = (ev: MouseEvent) => {
    ev.stopPropagation();
  };
  window.addEventListener('click', swallow, { capture: true, once: true });
  // A gesture that ends where no click is derived from it must not leave the
  // listener behind to eat the user's next real click. Timers run after that
  // click would have been dispatched.
  setTimeout(() => {
    window.removeEventListener('click', swallow, true);
  }, 0);
}

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

const INSET_PER_LEVEL = 12;
const MAX_INSET_FRACTION = 0.4;

const badgeStyles = computed<StyleValue>(() => {
  const top = event.time ? timeStartPosition(event.time) + 'px' : undefined;

  const dur = durationOverride ?? event.duration;
  const height = dur ? `calc(${timeDurationHeight(dur)}px - 2px)` : undefined;

  const plan = planOverride ?? event.plan;
  const halfSpan = viewBoth && plan !== 'both';
  const spanPercent = halfSpan ? 50 : 100;
  const basePercent = halfSpan && plan === 'b' ? 50 : 0;

  // Stacked events step in from the left so a strip of the one below stays
  // visible and grabbable. The cap is expressed in CSS rather than px because
  // the column width is only known there — it keeps a deep stack from
  // collapsing the block on a narrow column, at 40% of the event's own span.
  const inset =
    depth > 0
      ? `min(${depth * INSET_PER_LEVEL}px, ${spanPercent * MAX_INSET_FRACTION}%)`
      : null;

  const left = inset ? `calc(${basePercent}% + ${inset})` : `${basePercent}%`;
  const width = inset
    ? `calc(${spanPercent}% - 4px - ${inset})`
    : `calc(${spanPercent}% - 4px)`;

  return {
    backgroundColor: event.color ?? '#2196F3',
    top,
    height,
    left,
    width,
    // Consumed by the stylesheet, so `:hover` can still raise a covered event
    // above the stack — an inline z-index would win over any rule.
    '--cal-depth': String(depth),
    opacity: (isDragging.value && !isCopyDrag.value) || dimmed ? 0 : undefined,
    pointerEvents: isDragging.value || dimmed ? 'none' : undefined,
  };
});

// Reports the raw drag distance in minutes; snapping and clamping happen in
// the parent, which is the only place that can see the whole selection the
// resize applies to.
function startResize(e: MouseEvent) {
  if (!timeDurationHeight || !event.duration) {
    return;
  }

  const startY = e.clientY;
  const pixelsPerMinute = timeDurationHeight(60) / 60;
  const deltaAt = (clientY: number) => (clientY - startY) / pixelsPerMinute;

  function onMove(ev: MouseEvent) {
    emit('resize', deltaAt(ev.clientY), true);
  }

  function onUp(ev: MouseEvent) {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    emit('resize', deltaAt(ev.clientY), false);
    suppressNextClick();
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
    emit('change-plan', planAt(ev.clientX), true);
  }

  function onUp(ev: MouseEvent) {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    emit('change-plan', planAt(ev.clientX), false);
    suppressNextClick();
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
  // Each further event of an overlapping stack draws above the previous one
  z-index: var(--cal-depth, 0);

  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    // Lift a covered event out of the stack so it can be read in full — the
    // whole point of leaving a strip of it exposed to hover in the first place
    z-index: 10;
  }

  // A shadow along the inset edge reads as a card lying on top of another,
  // rather than as one wide block with a stripe
  &--stacked {
    box-shadow:
      -2px 0 4px rgba(0, 0, 0, 0.25),
      0 1px 2px rgba(0, 0, 0, 0.15);
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
