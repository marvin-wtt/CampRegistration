<template>
  <!-- Assembled from the draft rather than fetched, so an author can see the
       effect of a change before publishing it. -->
  <q-dialog v-model="model">
    <q-card class="privacy-preview">
      <q-card-section class="row items-center no-wrap q-pb-sm">
        <div class="col">
          <div class="text-h6">
            {{ title ?? t('privacy.editor.preview.title') }}
          </div>
          <div class="text-caption text-on-surface-variant">
            {{ hint ?? t('privacy.editor.preview.hint') }}
          </div>
        </div>
        <m-btn
          v-close-popup
          flat
          round
          icon="close"
          :aria-label="t('privacy.editor.action.close')"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="scroll privacy-preview__body">
        <privacy-notice
          v-if="notice"
          :notice
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { PublishedPrivacyNotice } from '@camp-registration/common/privacy';
import PrivacyNotice from '@/components/privacy/PrivacyNotice.vue';

const model = defineModel<boolean>({ required: true });

/** Both headings default to the draft preview, which is the common case. */
defineProps<{
  notice: PublishedPrivacyNotice | null;
  title?: string;
  hint?: string;
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<style lang="scss" scoped>
.privacy-preview {
  width: 45rem;
  max-width: 90vw;

  &__body {
    max-height: 65vh;
  }
}
</style>
