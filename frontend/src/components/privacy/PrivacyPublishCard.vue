<template>
  <q-card
    flat
    bordered
  >
    <!-- A passed slot is not the same as a rendered one: both pages pass a
         default slot whose contents are conditional, and an empty section with
         a separator under it reads as a heading someone forgot to write. -->
    <template v-if="hasDefaultContent">
      <q-card-section>
        <slot />
      </q-card-section>

      <q-separator />
    </template>

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
      v-if="hasNoteContent"
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
import { Comment, Fragment, Text, computed, useSlots, type VNode } from 'vue';
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
  /**
   * What to say when nothing is published and nothing has been edited. Absent
   * means that state is a draft worth warning about — true of an organization's
   * own notice, but not of a camp's optional additions to it.
   */
  emptyStatus?: { title: string; detail: string };
  /** A reason of the page's own why publishing cannot go ahead yet. */
  publishDisabled?: boolean;
  publishing?: boolean;
}>();

const emit = defineEmits<{
  publish: [];
  preview: [];
}>();

const { t, d } = useI18n({ useScope: 'global' });

const slots = useSlots();

// A `v-if` that fails still leaves a comment vnode behind, so the slot has to
// be rendered and looked at rather than merely counted.
function rendersContent(nodes: VNode[] | undefined): boolean {
  return (nodes ?? []).some((node) => {
    if (node.type === Comment) {
      return false;
    }
    if (node.type === Fragment) {
      return rendersContent(node.children as VNode[] | undefined);
    }
    if (node.type === Text) {
      return typeof node.children === 'string' && node.children.trim() !== '';
    }

    return true;
  });
}

const hasDefaultContent = computed(() => rendersContent(slots.default?.()));
const hasNoteContent = computed(() => rendersContent(slots.note?.()));

const status = computed(() => {
  if (props.publishedVersion === null) {
    if (props.emptyStatus && !props.hasUnpublishedChanges) {
      return {
        icon: 'info',
        color: 'on-surface-variant',
        ...props.emptyStatus,
      };
    }

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
