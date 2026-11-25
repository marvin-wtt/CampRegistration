<template>
  <!-- Receipt files as tiles, with a tile to add more. -->
  <div class="file-section column">
    <div class="file-row row">
      <div
        v-for="file in files"
        :key="file.key"
        class="file-entry column"
      >
        <div class="file-tile rounded-md">
          <button
            type="button"
            class="file-open column items-center justify-center"
            :disabled="!file.url"
            :aria-label="t('finance.action.openFile', { name: file.name })"
            @click="open(file)"
          >
            <!-- A photo the browser can't decode (e.g. HEIC) falls back to the icon. -->
            <img
              v-if="file.preview && !broken.has(file.key)"
              :src="file.preview"
              :alt="file.name"
              class="file-thumb"
              @error="broken.add(file.key)"
            />
            <q-icon
              v-else
              name="description"
              size="32px"
            />
            <q-spinner
              v-if="file.uploading"
              class="file-state"
              color="primary"
            />
          </button>
          <m-btn
            class="file-remove"
            icon="close"
            size="sm"
            round
            unelevated
            color="surface-container-highest"
            text-color="on-surface"
            :aria-label="t('finance.action.removeFile')"
            @click="emit('remove', file.key)"
          />
        </div>
        <div class="file-name ellipsis text-caption text-on-surface-variant">
          {{ file.name }}
          <q-tooltip>{{ file.name }}</q-tooltip>
        </div>
      </div>
      <!-- Always a tile, captioned like the files: no jump once one is added. -->
      <div class="file-entry column">
        <button
          type="button"
          class="file-add file-tile rounded-md column items-center justify-center"
          :aria-label="
            files.length
              ? t('finance.action.addFile')
              : t('finance.action.addReceipt')
          "
          data-test="expense-add-file"
          @click="fileInput?.click()"
        >
          <q-icon
            name="add_a_photo"
            size="28px"
          />
        </button>
        <div class="file-name text-caption text-primary text-center">
          {{
            files.length
              ? t('finance.action.addFile')
              : t('finance.action.addReceipt')
          }}
        </div>
      </div>
    </div>
    <!-- A scan is a copy: the paper stays the record. -->
    <div
      class="row items-center no-wrap q-gutter-x-xs text-caption text-on-surface-variant"
    >
      <q-icon
        name="info"
        size="16px"
      />
      <span>{{ t('finance.capture.keepOriginal') }}</span>
    </div>
    <input
      ref="fileInput"
      type="file"
      accept="image/*,application/pdf"
      capture="environment"
      multiple
      hidden
      @change="onFilesPicked"
    />
  </div>
</template>

<script lang="ts" setup>
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { reactive, useTemplateRef } from 'vue';
import { openURL } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { ReceiptFile } from '@/composables/receiptUploads';

const { files } = defineProps<{ files: readonly ReceiptFile[] }>();

const emit = defineEmits<{
  add: [files: File[]];
  remove: [key: string];
}>();

const { t } = useI18n();
const fileInput = useTemplateRef<HTMLInputElement>('fileInput');
const broken = reactive(new Set<string>());

function onFilesPicked(event: Event) {
  const input = event.target as HTMLInputElement;
  emit('add', Array.from(input.files ?? []));
  input.value = '';
}

function open(file: ReceiptFile) {
  if (file.url) {
    openURL(file.url);
  }
}
</script>

<style scoped>
/* Flex gap, not q-gutter: nested in the form's gutter, the gutters add up. */
.file-section {
  gap: 8px;
}

.file-row {
  gap: 8px;
}

.file-entry {
  width: 88px;
  gap: 4px;
}

.file-tile {
  position: relative;
  width: 88px;
  height: 88px;
  overflow: hidden;
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
}

.file-add {
  padding: 0;
  border: 1px dashed var(--md3-outline);
  background: transparent;
  color: var(--md3-primary);
  cursor: pointer;
}

.file-add:hover,
.file-add:focus-visible {
  background: var(--md3-surface-container-high);
  outline: none;
}

.file-open {
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
}

.file-open:disabled {
  cursor: default;
}

.file-name {
  max-width: 100%;
}

.file-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-state {
  position: absolute;
}

.file-remove {
  position: absolute;
  top: 4px;
  right: 4px;
}
</style>
