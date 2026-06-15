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
      ref="sheet"
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
        v-touch-pan.vertical.prevent.mouse="onDragHandlePan"
        class="md3-bottom-sheet__drag-area"
        aria-hidden="true"
      >
        <div class="md3-bottom-sheet__drag-handle" />
      </div>

      <div class="md3-bottom-sheet__content">
        <slot />
      </div>
    </section>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef } from 'vue';
import { useDialogPluginComponent } from 'quasar';

const {
  persistent = false,
  noBackdropDismiss = false,
  noEscDismiss = false,
  noDragHandle = false,
  fullHeight = false,
  noPadding = false,
} = defineProps<{
  persistent?: boolean;
  noBackdropDismiss?: boolean;
  noEscDismiss?: boolean;
  noDragHandle?: boolean;
  fullHeight?: boolean;
  noPadding?: boolean;
}>();

const model = defineModel<boolean>({
  required: true,
});

defineEmits([...useDialogPluginComponent.emits]);

const sheet = useTemplateRef('sheet');
const dragOffset = ref(0);
const dragging = ref(false);

const sheetStyle = computed(() =>
  dragOffset.value > 0
    ? { transform: `translateY(${dragOffset.value}px)` }
    : undefined,
);

interface TouchPanDetails {
  isFirst?: boolean;
  isFinal?: boolean;
  offset?: { x: number; y: number };
}

function onDragHandlePan(details: TouchPanDetails) {
  if (details.isFirst) {
    dragging.value = true;
  }

  // Only follow downward drags; the sheet cannot be pulled up
  dragOffset.value = Math.max(0, details.offset?.y ?? 0);

  if (!details.isFinal) {
    return;
  }

  dragging.value = false;

  const sheetHeight = sheet.value?.offsetHeight ?? 0;
  const dismissThreshold = Math.max(sheetHeight * 0.25, 80);

  if (!persistent && dragOffset.value > dismissThreshold) {
    // Keep the offset so the slide-down transition continues from the
    // current position; it is reset in onHide.
    model.value = false;
  } else {
    dragOffset.value = 0;
  }
}

function onHide() {
  dragOffset.value = 0;
}
</script>

<style scoped>
.md3-bottom-sheet {
  /* QDialog sets pointer-events: none on its inner wrapper and only
     re-enables it for direct <div> children; this sheet is a <section> */
  pointer-events: all;

  width: 100vw;
  max-width: 640px;
  max-height: min(80dvh, 720px);
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

  transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1);
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
