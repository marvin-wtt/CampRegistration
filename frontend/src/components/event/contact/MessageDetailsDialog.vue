<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card
      class="details-card rounded-xl"
      style="width: min(700px, 95vw); max-width: min(900px, 95vw)"
    >
      <q-toolbar class="q-px-sm">
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

      <q-separator />

      <q-scroll-area style="height: min(520px, 65vh)">
        <div class="q-pa-md">
          <message-details-content
            :message
            :registrations
          />
        </div>
      </q-scroll-area>
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
  background: var(--md3-surface-container-low);
  overflow: hidden;
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
