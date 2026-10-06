<!-- src/components/md3/MdBottomSheet.vue -->
<template>
  <q-dialog
    v-model="model"
    position="bottom"
    :persistent="persistent"
    :no-backdrop-dismiss="noBackdropDismiss"
    :no-esc-dismiss="noEscDismiss"
    transition-show="slide-up"
    transition-hide="slide-down"
    @hide="onHide"
  >
    <section
      class="md3-bottom-sheet"
      :class="{
        'md3-bottom-sheet--full-height': fullHeight,
        'md3-bottom-sheet--no-padding': noPadding,
        'md3-bottom-sheet--dragging': dragging,
      }"
      :style="sheetStyle"
      role="dialog"
      aria-modal="true"
    >
      <div
        v-if="!noDragHandle"
        ref="dragArea"
        v-touch-pan.vertical.prevent.mouse="drag"
        class="md3-bottom-sheet__drag-area"
        aria-hidden="true"
      >
        <div class="md3-bottom-sheet__drag-handle" />
      </div>

      <div
        ref="content"
        class="md3-bottom-sheet__content"
      >
        <slot />
      </div>
    </section>
  </q-dialog>
</template>

<script lang="ts">
/**
 * A resting height: fitting the content, half or (nearly) all of the screen,
 * or a share of the screen height.
 */
export type SnapPoint = 'content' | 'half' | 'full' | number;
</script>

<script lang="ts" setup>
import { computed, nextTick, useTemplateRef, watch } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useKeyboardInset } from '@/composables/keyboardInset';
import { useSheetDrag } from '@/composables/sheetDrag';

const {
  persistent = false,
  noBackdropDismiss = false,
  noEscDismiss = false,
  noDragHandle = false,
  fullHeight = false,
  noPadding = false,
  snapPoints = undefined,
  maxHeight = 0.9,
} = defineProps<{
  persistent?: boolean;
  noBackdropDismiss?: boolean;
  noEscDismiss?: boolean;
  noDragHandle?: boolean;
  fullHeight?: boolean;
  noPadding?: boolean;
  /**
   * Heights the handle can resize the sheet to; it opens at the first.
   * Without, the sheet fits its content and the handle only dismisses.
   */
  snapPoints?: SnapPoint[] | undefined;
  /** Tallest the sheet gets, as a share of the screen height. */
  maxHeight?: number;
}>();

// Bind with v-model, or leave it off and drive the sheet via show()/hide() —
// which also makes it usable as the root of a Quasar dialog plugin component.
const model = defineModel<boolean>({ default: false });

const emit = defineEmits([...useDialogPluginComponent.emits]);

defineExpose({
  show: () => (model.value = true),
  hide: () => (model.value = false),
});

const dragArea = useTemplateRef('dragArea');
const content = useTemplateRef('content');

function viewportHeight(): number {
  return window.visualViewport?.height ?? window.innerHeight;
}

function snapHeight(point: SnapPoint, viewport: number, cap: number): number {
  switch (point) {
    case 'full':
      return cap;
    case 'half':
      return viewport * 0.5;
    case 'content':
      return (
        (dragArea.value?.offsetHeight ?? 0) + (content.value?.scrollHeight ?? 0)
      );
    default:
      return viewport * point;
  }
}

// Ascending pixel heights, none above the cap.
function snapHeights(): number[] {
  const viewport = viewportHeight();
  const cap = viewport * maxHeight;
  const heights = (snapPoints ?? []).map((point) =>
    Math.round(Math.min(snapHeight(point, viewport, cap), cap)),
  );
  return [...new Set(heights)].sort((a, b) => a - b);
}

const snaps = !!snapPoints?.length;

const { dragging, offset, height, drag, reset } = useSheetDrag(
  () => {
    if (persistent) {
      reset();
    } else {
      // The offset stays where the finger left it, so the slide-down
      // transition continues from there; it is reset in onHide.
      model.value = false;
    }
  },
  snaps ? { heights: snapHeights } : undefined,
);

// Placed once the content has rendered, so 'content' can be measured.
watch(model, async (open) => {
  if (open) {
    await nextTick();
    reset();
  }
});

// Lifts the sheet above the on-screen keyboard.
const keyboardInset = useKeyboardInset(model);

// Lifted, a tall sheet would push its top — often the focused input — off
// screen, so it shrinks to the space above the keyboard.
const capHeight = computed<string | null>(() => {
  if (keyboardInset.value > 0) {
    return `${maxHeight * (window.innerHeight - keyboardInset.value)}px`;
  }
  return fullHeight ? null : `${maxHeight * 100}dvh`;
});

const sheetStyle = computed(() => {
  const translateY = offset.value - keyboardInset.value;

  return {
    ...(translateY !== 0 ? { transform: `translateY(${translateY}px)` } : {}),
    ...(snaps && height.value !== null ? { height: `${height.value}px` } : {}),
    ...(capHeight.value ? { maxHeight: capHeight.value } : {}),
  };
});

function onHide() {
  reset();
  emit('hide');
}
</script>

<style scoped>
.md3-bottom-sheet {
  /* QDialog sets pointer-events: none on its inner wrapper and only
     re-enables it for direct <div> children; this sheet is a <section> */
  pointer-events: all;

  width: 100vw;
  max-width: 640px;
  /* Overridden by the maxHeight prop; the fallback if styles load first. */
  max-height: 90dvh;
  margin-inline: auto;

  display: flex;
  flex-direction: column;

  overflow: hidden;
  border-radius: 28px 28px 0 0;

  background: var(--md3-surface-container-low);
  color: var(--md3-on-surface);

  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.3),
    0 4px 8px 3px rgba(0, 0, 0, 0.15);

  transition:
    transform 0.25s cubic-bezier(0.2, 0, 0, 1),
    height 0.25s cubic-bezier(0.2, 0, 0, 1);
}

.md3-bottom-sheet--dragging {
  transition: none;
}

.md3-bottom-sheet--full-height {
  height: calc(100dvh - 56px);
  max-height: calc(100dvh - 56px);
}

.md3-bottom-sheet__drag-area {
  height: 48px;
  min-height: 48px;

  display: flex;
  align-items: center;
  justify-content: center;

  cursor: grab;
  touch-action: none;
  user-select: none;
}

.md3-bottom-sheet--dragging .md3-bottom-sheet__drag-area {
  cursor: grabbing;
}

.md3-bottom-sheet__drag-handle {
  width: 32px;
  height: 4px;
  border-radius: 999px;

  background: var(--md3-on-surface-variant);

  opacity: 0.4;
}

.md3-bottom-sheet__content {
  flex: 1;
  min-height: 0;
  overflow: auto;

  padding: 0 24px max(24px, env(safe-area-inset-bottom));
}

.md3-bottom-sheet--no-padding .md3-bottom-sheet__content {
  padding: 0;
}

@media (min-width: 641px) {
  .md3-bottom-sheet {
    width: min(640px, calc(100vw - 48px));
    margin-bottom: 24px;
    border-radius: 28px;
  }
}
</style>
