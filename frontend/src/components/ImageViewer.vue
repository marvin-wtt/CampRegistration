<template>
  <div class="relative-position column">
    <div class="col-shrink row justify-around">
      <div
        id="scale-control"
        class="q-gutter-x-xs"
      >
        <q-btn
          icon="add"
          size="sm"
          dense
          rounded
          flat
          @click="scaleUp"
        />
        <a>{{ scale * 100 }} %</a>
        <q-btn
          icon="remove"
          size="sm"
          dense
          rounded
          flat
          @click="scaleDown"
        />
      </div>

      <div
        id="rotation-control"
        class="q-gutter-x-xs"
      >
        <q-btn
          icon="rotate_left"
          size="sm"
          dense
          rounded
          flat
          @click="rotateLeft"
        />
        <a>{{ rotation }} °</a>
        <q-btn
          icon="rotate_right"
          size="sm"
          dense
          rounded
          flat
          @click="rotateRight"
        />
      </div>
    </div>

    <q-scroll-area class="col viewer">
      <!-- TODO Cross origin should not be needed, only for testing -->

      <div class="image-wrapper">
        <img
          ref="imageRef"
          :src="props.url"
          crossorigin="use-credentials"
          :style="imageStyle"
        />
      </div>

      <!--      <q-img-->
      <!--        crossorigin="use-credentials"-->
      <!--        :src="props.url"-->
      <!--        :style="imageStyle"-->
      <!--      />-->
    </q-scroll-area>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, StyleValue } from 'vue';
import { QScrollArea } from 'quasar';

const props = defineProps<{
  url: string;
}>();

const scale = ref<number>(1);
const rotation = ref<number>(0);

const imageRef = ref<HTMLElement>();
const imageStyle = computed<StyleValue>(() => {
  if (!imageRef.value) return {};

  const { marginLeft, marginTop } = calculateMargins(
    imageRef.value.clientWidth,
    imageRef.value.clientHeight,
    scale.value,
    rotation.value,
  );

  return {
    marginTop: `${marginTop}px`,
    marginLeft: `${marginLeft}px`,
    transform: `scale(${scale.value}) rotate(${rotation.value}deg)`,
    transition: 'transform 0.3s ease',
  };
});

function calculateMargins(
  width: number,
  height: number,
  scale: number,
  rotation: number,
) {
  // Check if the rotation is in a rotated state (90 or 270 degrees)
  const isRotated = Math.abs(rotation % 180) === 90;

  // Swap width and height if rotated
  const [adjustedWidth, adjustedHeight] = isRotated
    ? [height, width]
    : [width, height];

  // Calculate the margins based on the adjusted dimensions
  const marginTop = (adjustedHeight * scale - height) / 2;
  const marginLeft = (adjustedWidth * scale - width) / 2;

  return { marginTop, marginLeft };
}

function scaleUp() {
  scale.value = Math.min(5, scale.value + 0.25);
}

function scaleDown() {
  scale.value = Math.max(0.25, scale.value - 0.25);
}

function rotateRight() {
  rotation.value = rotation.value + 90;
}

function rotateLeft() {
  rotation.value = rotation.value - 90;
}
</script>

<style scoped>
.image-wrapper img {
  max-width: 100%;
  max-height: 100%;
}

.viewer {
  border: 1px solid;
  border-radius: 15px;
}
</style>
