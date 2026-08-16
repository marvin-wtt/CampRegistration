<template>
  <q-card
    flat
    bordered
  >
    <q-card-section v-if="$slots.default">
      <slot />
    </q-card-section>

    <q-separator v-if="$slots.default" />

    <!-- Publishing is the only write, so the state answers one question: is
         what the registrant reads the same as what is on screen? -->
    <q-card-section class="row items-start no-wrap q-gutter-sm">
      <q-icon
        :name="status.icon"
        :class="`text-${status.color}`"
        size="20px"
      />
      <div class="col">
        <div :class="`text-body2 text-${status.color}`">
          {{ status.title }}
        </div>
        <div class="text-caption text-on-surface-variant">
          {{ status.detail }}
        </div>
      </div>
    </q-card-section>

    <q-card-section
      v-if="$slots.note"
      class="q-pt-none"
    >
      <slot name="note" />
    </q-card-section>

    <q-card-actions v-if="canEdit">
      <m-btn
        :label="t('privacy.editor.action.publish')"
        color="primary"
        :disable="publishDisabled || !hasUnpublishedChanges"
        :loading="publishing"
        @click="emit('publish')"
      />
      <m-btn
        :label="t('privacy.editor.action.preview')"
        icon="visibility"
        flat
        color="primary"
        @click="emit('preview')"
      />
    </q-card-actions>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const props = defineProps<{
  publishedVersion: number | null;
  publishedAt: string | null;
  /** Whether the editor holds changes the published version does not have. */
  hasUnpublishedChanges: boolean;
  canEdit: boolean;
  /**
   * What "never published" means here — the consequence differs between an
   * organization's notice and a camp's additions to it, and it is the only
   * part of the state line that does.
   */
  unpublishedDetail: string;
  /** A reason of the page's own why publishing cannot go ahead yet. */
  publishDisabled?: boolean;
  publishing?: boolean;
}>();

const emit = defineEmits<{
  publish: [];
  preview: [];
}>();

const { t, d } = useI18n({ useScope: 'global' });

const status = computed(() => {
  if (props.publishedVersion === null) {
    return {
      icon: 'edit_note',
      color: 'warning',
      title: t('privacy.editor.status.draft.title'),
      detail: props.unpublishedDetail,
    };
  }

  const live = t('privacy.editor.status.live', {
    version: props.publishedVersion,
    date: props.publishedAt ? d(props.publishedAt, 'short') : '',
  });

  if (props.hasUnpublishedChanges) {
    return {
      icon: 'edit',
      color: 'warning',
      title: t('privacy.editor.status.unpublished.title'),
      detail: `${t('privacy.editor.status.unpublished.detail')} ${live}`,
    };
  }

  return {
    icon: 'check_circle',
    color: 'positive',
    title: t('privacy.editor.status.published.title'),
    detail: live,
  };
});
</script>
