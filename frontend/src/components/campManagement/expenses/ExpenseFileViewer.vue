<template>
  <pdf-viewer
    v-if="file.type === 'application/pdf'"
    :key="file.url"
    :url="file.url"
    class="file-viewer"
  />

  <image-viewer
    v-else-if="file.type.startsWith('image')"
    :url="file.url"
    class="file-viewer"
  />

  <iframe
    v-else
    :src="file.url"
    :title="file.name"
    class="file-viewer"
  />
</template>

<script lang="ts" setup>
import ImageViewer from 'components/ImageViewer.vue';
import PdfViewer from 'components/PdfViewer.vue';

interface SimpleFile {
  name: string;
  type: string;
  url: string;
}

const { file } = defineProps<{
  file: SimpleFile;
}>();
</script>

<style scoped>
.file-viewer {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 100%;
  border: none;
}
</style>
