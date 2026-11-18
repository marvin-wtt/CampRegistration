<template>
  <div
    class="signature-field column no-wrap q-gutter-y-xs"
    :class="{ 'signature-field--fill': fill }"
  >
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
    <!-- Pad tools: the caller's on the left, clearing on the right. -->
    <div class="row items-center no-wrap">
      <slot name="tools" />
      <q-space />
      <m-btn
        :label="clearLabel"
        :disable="!model"
        icon="backspace"
        text
        rounded
        color="primary"
        size="sm"
        @click="clear"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef } from 'vue';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { SIGNATURE_VIEWBOX } from '@camp-registration/common/entities';

const {
  label,
  clearLabel,
  fill = false,
} = defineProps<{
  /** Shown in the empty pad and read by screen readers. */
  label: string;
  clearLabel: string;
  /** As wide as its container, e.g. full screen, not a signature line. */
  fill?: boolean;
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
/* Stored as 3 : 1, so the width caps its height: about a signature line's
   size on desktop, the full width on phones. */
.signature-field {
  flex: none;
  width: 100%;
  max-width: 420px;
  /* Sideways only: a parent's gutter sets the top margin. */
  margin-left: auto;
  margin-right: auto;
}

.signature-field--fill {
  max-width: none;
}

/* Never shrunk by a flex parent: the surface keeps its ratio and would
   spill out, baseline and strokes drawn below the box. */
.signature-pad {
  flex: none;
  overflow: hidden;
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
