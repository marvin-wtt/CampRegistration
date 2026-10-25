<template>
  <q-card
    flat
    bordered
    class="section-card"
  >
    <q-card-section class="q-pb-none">
      <div class="row items-center no-wrap q-gutter-sm">
        <q-icon
          :name="icon"
          color="primary"
          size="20px"
        />
        <div class="text-subtitle2 text-weight-bold">
          {{ title }}
        </div>
      </div>
    </q-card-section>

    <q-card-section class="file-slot-body">
      <div class="file-slot-main">
        <!-- At the image's own shape, so a wide banner isn't cropped square. -->
        <q-avatar
          size="64px"
          rounded
          class="file-tile"
          :class="file ? fileTileClass(file.type) : 'tile--other'"
          :style="{ width: `${64 * thumbnailRatio}px` }"
        >
          <img
            v-if="file?.type.startsWith('image/')"
            class="file-tile__image"
            :src="fileUrl"
            :alt="title"
          />
          <q-icon
            v-else
            :name="file ? fileIcon(file.type) : 'hide_image'"
            size="24px"
          />
        </q-avatar>

        <div class="file-slot-info">
          <div class="text-body2">
            {{ description }}
          </div>
          <div
            v-if="!file"
            class="text-caption text-grey-6 q-mt-xs"
          >
            {{ emptyText }}
          </div>
          <div
            v-else-if="file.accessLevel !== 'public'"
            class="text-caption text-negative q-mt-xs"
          >
            {{ notPublicText }}
          </div>
        </div>
      </div>

      <div class="file-slot-actions">
        <q-btn
          v-if="file && canDelete"
          :aria-label="t('action.delete')"
          icon="delete"
          color="negative"
          flat
          round
          @click="emit('delete')"
        />

        <m-btn
          v-if="canUpload"
          :label="file ? changeLabel : addLabel"
          :loading="uploadLoading"
          color="primary"
          outline
          icon="add_photo_alternate"
          @click="emit('upload')"
        />
      </div>
    </q-card-section>
    <!-- A preview of how the file is used, where a thumbnail can't show it. -->
    <q-card-section
      v-if="$slots.default"
      class="q-pt-none"
    >
      <slot />
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import type { ServiceFile } from '@camp-registration/common/entities';
import { fileIcon, fileTileClass } from '@/utils/fileTypeIcon';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const { t } = useI18n();

const { thumbnailRatio = 1 } = defineProps<{
  icon: string;
  title: string;
  file?: ServiceFile | undefined;
  fileUrl?: string | undefined;
  description: string;
  emptyText: string;
  notPublicText: string;
  addLabel: string;
  changeLabel: string;
  canUpload: boolean;
  canDelete: boolean;
  uploadLoading?: boolean;
  // Width to height of the thumbnail.
  thumbnailRatio?: number;
}>();

const emit = defineEmits<{
  upload: [];
  delete: [];
}>();
</script>

<style scoped>
.section-card {
  border-radius: 16px;
}

.file-tile {
  flex-shrink: 0;
  border-radius: 12px;
}

.file-tile__image {
  object-fit: cover;
}

.tile--document {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.tile--media {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

.tile--other {
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
}

/* Wraps by available space, not viewport width, since this card can sit in
   containers narrower than the page itself: actions drop to their own
   right-aligned line once the info column can no longer shrink further. */
.file-slot-body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.file-slot-main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;

  flex: 1 1 240px;
  min-width: 0;
}

/* Drops below a wide thumbnail rather than shrinking to a narrow column. */
.file-slot-info {
  flex: 1 1 180px;
  min-width: 0;
}

.file-slot-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;

  margin-left: auto;
}
</style>

<i18n lang="yaml" locale="en">
action:
  delete: 'Delete'
</i18n>
<i18n lang="yaml" locale="de">
action:
  delete: 'Löschen'
</i18n>
<i18n lang="yaml" locale="fr">
action:
  delete: 'Supprimer'
</i18n>
<i18n lang="yaml" locale="pl">
action:
  delete: 'Usuń'
</i18n>
<i18n lang="yaml" locale="cs">
action:
  delete: 'Smazat'
</i18n>
