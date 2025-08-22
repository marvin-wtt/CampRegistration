<template>
  <div class="relative-position column">
    <div class="col-shrink row justify-around">
      <div>{{ currentPage }} / {{ pages }}</div>

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

    <q-scroll-area
      class="col"
      @scroll="onScroll"
    >
      <div class="q-gutter-y-sm">
        <div
          v-for="page in pages"
          :key="page"
        >
          <VuePDF
            :pdf="pdf"
            :scale
            :rotation
            :page
            text-layer
            annotation-layer
            :style="{}"
          >
            <q-inner-loading :showing="true" />
          </VuePDF>
        </div>
      </div>
    </q-scroll-area>
  </div>
</template>

<script lang="ts" setup>
import '@tato30/vue-pdf/style.css';
import { VuePDF, usePDF } from '@tato30/vue-pdf';
import { ref } from 'vue';
import type { QScrollAreaProps } from 'quasar';

const props = defineProps<{
  url: string;
}>();

const scale = ref<number>(1);
const rotation = ref<number>(0);
const currentPage = ref<number>(1);

const { pdf, pages } = usePDF(
  {
    url: props.url,
    withCredentials: true,
    enableXfa: true,
  },
  {},
);

function scaleUp() {
  scale.value = Math.min(2, scale.value + 0.25);
}

function scaleDown() {
  scale.value = Math.max(0.25, scale.value - 0.25);
}

function rotateRight() {
  rotation.value = rotation.value + (90 % 360);
}

function rotateLeft() {
  rotation.value = rotation.value - (90 % 360);
}

type ScrollLInfo = Parameters<
  Exclude<QScrollAreaProps['onScroll'], undefined>
>[0];
function onScroll(info: ScrollLInfo) {
  currentPage.value = Math.max(
    1,
    Math.ceil(info.verticalPercentage * pages.value),
  );
}
</script>

<style scoped></style>
