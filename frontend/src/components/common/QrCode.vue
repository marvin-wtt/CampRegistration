<template>
  <canvas ref="qrCanvas" />
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import QRCode, { type QRCodeRenderersOptions } from 'qrcode';

const props = defineProps<
  QRCodeRenderersOptions & {
    value: string;
  }
>();

const qrCanvas = ref<HTMLCanvasElement>();

onMounted(generate);

watch(props, generate);

async function generate() {
  const options = {
    ...props,
  };

  await QRCode.toCanvas(qrCanvas.value, props.value, options);
}
</script>

<style scoped></style>
