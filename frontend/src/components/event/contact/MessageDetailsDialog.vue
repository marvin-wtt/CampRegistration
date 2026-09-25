<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="details-card rounded-xl column no-wrap">
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
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Message, Registration } from '@camp-registration/common/entities';
import MessageDetailsContent from '@/components/event/contact/MessageDetailsContent.vue';

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();

// A static snapshot rather than a reactive store lookup (unlike
// RegistrationDetailsDialog): messages have no in-place editors elsewhere in
// the UI, so there's nothing for this dialog to stay in sync with.
defineProps<{
  message: Message;
  registrations: Registration[];
}>();
</script>

<style scoped>
.details-card {
  width: min(720px, 95vw);
  max-width: min(900px, 95vw);
  max-height: 88vh;
  background: var(--md3-surface-container-low);
  overflow: hidden;
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

.header-btn {
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Sent message'
action:
  close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Gesendete Nachricht'
action:
  close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Message envoyé'
action:
  close: 'Fermer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Wysłana wiadomość'
action:
  close: 'Zamknij'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Odeslaná zpráva'
action:
  close: 'Zavřít'
</i18n>
