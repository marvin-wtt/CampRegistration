<template>
  <responsive-dialog
    ref="dialogRef"
    :snap-points="[0.6, 'full']"
    @hide="onDialogHide"
  >
    <q-card
      class="details-card column no-wrap"
      :class="sheet ? 'details-card--sheet' : 'rounded-xl'"
      :flat="sheet"
    >
      <q-toolbar class="details-toolbar q-px-sm">
        <q-icon
          name="mail"
          size="sm"
          class="q-mx-sm"
        />
        <q-toolbar-title class="text-subtitle1 text-weight-medium">
          {{ t('title') }}
        </q-toolbar-title>
        <q-btn
          v-close-popup
          class="header-btn"
          dense
          flat
          round
          icon="close"
          @click="onDialogCancel"
        >
          <q-tooltip>{{ t('action.close') }}</q-tooltip>
        </q-btn>
      </q-toolbar>

      <!-- Sized to the email, scrolling only once it outgrows the viewport. -->
      <div class="details-content">
        <message-details-content
          :message
          :registrations
        />
      </div>

      <div
        v-if="canDelete || canReuse"
        class="details-actions"
      >
        <m-btn
          v-if="canDelete"
          text
          error
          no-caps
          icon="delete_outline"
          :label="t('action.delete')"
          @click="onDialogOK('delete' satisfies MessageAction)"
        />
        <m-btn
          v-if="canReuse"
          primary
          no-caps
          icon="edit_note"
          :label="t('action.reuse')"
          @click="onDialogOK('reuse' satisfies MessageAction)"
        />
      </div>
    </q-card>
  </responsive-dialog>
</template>

<script lang="ts">
/** What the manager chose to do with the message; the caller carries it out. */
export type MessageAction = 'reuse' | 'delete';
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Message, Registration } from '@camp-registration/common/entities';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import MessageDetailsContent from '@/components/event/contact/MessageDetailsContent.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const quasar = useQuasar();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

// A static snapshot rather than a reactive store lookup (unlike
// RegistrationDetailsDialog): messages have no in-place editors elsewhere in
// the UI, so there's nothing for this dialog to stay in sync with.
const { canDelete = false, canReuse = false } = defineProps<{
  message: Message;
  registrations: Registration[];
  canDelete?: boolean;
  canReuse?: boolean;
}>();

// Mirrors ResponsiveDialog's switch to a bottom sheet.
const sheet = computed<boolean>(() => quasar.screen.lt.sm);
</script>

<style scoped>
.details-card {
  width: min(720px, 95vw);
  max-width: min(900px, 95vw);
  max-height: 88vh;
  background: var(--md3-surface-container-low);
  overflow: hidden;
}

/* The sheet draws the surface and sets the height. */
.details-card--sheet {
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  background: transparent;
}

.details-toolbar {
  background: transparent;
}

.details-content {
  flex: 1 1 auto;
  min-height: 0;
  padding: 4px 24px 24px;
  overflow-y: auto;
}

.details-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
}

.details-card--sheet .details-actions {
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}

.header-btn {
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Sent message'
action:
  close: 'Close'
  reuse: 'Use as template'
  delete: 'Delete'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Gesendete Nachricht'
action:
  close: 'Schließen'
  reuse: 'Als Vorlage verwenden'
  delete: 'Löschen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Message envoyé'
action:
  close: 'Fermer'
  reuse: 'Utiliser comme modèle'
  delete: 'Supprimer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Wysłana wiadomość'
action:
  close: 'Zamknij'
  reuse: 'Użyj jako szablon'
  delete: 'Usuń'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Odeslaná zpráva'
action:
  close: 'Zavřít'
  reuse: 'Použít jako šablonu'
  delete: 'Smazat'
</i18n>
