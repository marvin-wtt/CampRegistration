<template>
  <div class="message-view column no-wrap">
    <div class="message-view__content col">
      <message-undelivered
        :message
        :registrations
        :can-retry="canReuse"
        class="q-mb-md"
        @retry="(recipients) => emit('action', { action: 'retry', recipients })"
      />
      <message-details-content
        :message
        :registrations
      />
    </div>

    <div
      v-if="canDelete || canReuse"
      class="message-view__actions"
    >
      <m-btn
        v-if="canDelete"
        text
        error
        no-caps
        icon="delete_outline"
        :label="t('action.delete')"
        @click="emit('action', { action: 'delete' })"
      />
      <m-btn
        v-if="canReuse"
        primary
        no-caps
        icon="edit_note"
        :label="t('action.reuse')"
        @click="emit('action', { action: 'reuse' })"
      />
    </div>
  </div>
</template>

<script lang="ts">
import type { Registration } from '@camp-registration/common/entities';

/** What the manager chose to do with a sent message; the page carries it out. */
export type MessageAction =
  | { action: 'reuse' }
  | { action: 'delete' }
  | { action: 'retry'; recipients: Registration[] };
</script>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { Message } from '@camp-registration/common/entities';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import MessageDetailsContent from '@/components/event/contact/MessageDetailsContent.vue';
import MessageUndelivered from '@/components/event/contact/MessageUndelivered.vue';

const {
  message,
  registrations,
  canDelete = false,
  canReuse = false,
} = defineProps<{
  message: Message;
  registrations: Registration[];
  canDelete?: boolean;
  canReuse?: boolean;
}>();

const emit = defineEmits<{
  action: [action: MessageAction];
}>();

const { t } = useI18n();
</script>

<style scoped>
.message-view {
  min-height: 0;
}

.message-view__content {
  min-height: 0;
  padding: 4px 24px 24px;
  overflow-y: auto;
}

.message-view__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
}

@media (max-width: 599px) {
  .message-view__content {
    padding: 0 16px 16px;
  }

  .message-view__actions {
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }
}
</style>

<i18n lang="yaml" locale="en">
action:
  reuse: 'Use as template'
  delete: 'Delete'
</i18n>

<i18n lang="yaml" locale="de">
action:
  reuse: 'Als Vorlage verwenden'
  delete: 'Löschen'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  reuse: 'Utiliser comme modèle'
  delete: 'Supprimer'
</i18n>

<i18n lang="yaml" locale="pl">
action:
  reuse: 'Użyj jako szablon'
  delete: 'Usuń'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  reuse: 'Použít jako šablonu'
  delete: 'Smazat'
</i18n>
