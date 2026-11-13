<template>
  <div class="column q-gutter-y-xs">
    <div
      class="signature-pad rounded-md"
      :class="{ 'signature-pad--empty': !model }"
    >
      <svg
        ref="surface"
        :viewBox="`0 0 ${SIGNATURE_VIEWBOX.width} ${SIGNATURE_VIEWBOX.height}`"
        class="signature-surface"
        role="img"
        :aria-label="label"
        @pointerdown="start"
        @pointermove="draw"
        @pointerup="end"
        @pointercancel="end"
        @pointerleave="end"
      >
        <line
          :x1="24"
          :x2="SIGNATURE_VIEWBOX.width - 24"
          :y1="SIGNATURE_VIEWBOX.height - 40"
          :y2="SIGNATURE_VIEWBOX.height - 40"
          class="signature-baseline"
        />
        <path
          :d="path"
          class="signature-ink"
        />
      </svg>
      <span
        v-if="!model"
        class="signature-placeholder text-body2"
      >
        {{ label }}
      </span>
    </div>
    <div class="row justify-end">
      <q-btn
        :label="clearLabel"
        :disable="!model"
        icon="backspace"
        flat
        rounded
        no-caps
        size="sm"
        @click="clear"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef } from 'vue';
import { SIGNATURE_VIEWBOX } from '@camp-registration/common/entities';

const { label, clearLabel } = defineProps<{
  /** Shown in the empty pad and read by screen readers. */
  label: string;
  clearLabel: string;
}>();

/** SVG path data in the shared view box; `null` until something is drawn. */
const model = defineModel<string | null>({ required: true });

const surface = useTemplateRef<SVGSVGElement>('surface');
const drawing = ref(false);
// The stroke being drawn, added to the model once the pointer lifts.
const current = ref('');

const path = computed(() => `${model.value ?? ''} ${current.value}`.trim());

function point(event: PointerEvent): string {
  const box = surface.value?.getBoundingClientRect();
  if (!box) {
    return '0 0';
  }
  const x = ((event.clientX - box.left) / box.width) * SIGNATURE_VIEWBOX.width;
  const y = ((event.clientY - box.top) / box.height) * SIGNATURE_VIEWBOX.height;
  return `${x.toFixed(1)} ${y.toFixed(1)}`;
}

function start(event: PointerEvent) {
  // Keeps a finger from scrolling the sheet while signing.
  event.preventDefault();
  surface.value?.setPointerCapture(event.pointerId);
  drawing.value = true;
  current.value = `M${point(event)}`;
}

function draw(event: PointerEvent) {
  if (!drawing.value) {
    return;
  }
  current.value += ` L${point(event)}`;
}

function end() {
  if (!drawing.value) {
    return;
  }
  drawing.value = false;
  // A tap without movement still leaves a dot.
  const stroke = current.value.includes('L')
    ? current.value
    : `${current.value} l0.5 0.5`;
  model.value = `${model.value ?? ''} ${stroke}`.trim();
  current.value = '';
}

function clear() {
  model.value = null;
  current.value = '';
}
</script>

<style scoped>
.signature-pad {
  position: relative;
  border: 1px solid var(--md3-outline);
  background: var(--md3-surface-container-lowest);
}

.signature-surface {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 3 / 1;
  touch-action: none;
  cursor: crosshair;
}

.signature-baseline {
  stroke: var(--md3-outline-variant);
  stroke-width: 1.5;
  stroke-dasharray: 6 6;
}

.signature-ink {
  fill: none;
  stroke: var(--md3-on-surface);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.signature-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md3-on-surface-variant);
  pointer-events: none;
}
</style>
