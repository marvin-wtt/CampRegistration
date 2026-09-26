<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card
      class="resend-card rounded-xl"
      style="width: min(440px, 95vw)"
    >
      <q-card-section class="q-pb-sm">
        <div class="resend-title">{{ t('title') }}</div>
        <div class="resend-subject">{{ subject }}</div>
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <div class="resend-label">{{ t('recipients') }}</div>
        <ul class="resend-recipients">
          <li
            v-for="recipient in recipients"
            :key="recipient.address"
            class="resend-recipient"
            :class="{ 'resend-recipient--bounced': recipient.bouncedLastTime }"
          >
            <q-icon
              :name="recipient.bouncedLastTime ? 'error_outline' : 'mail'"
              size="18px"
              class="resend-recipient__icon"
            />
            <div class="resend-recipient__text">
              <div class="ellipsis">{{ recipient.address }}</div>
              <div
                v-if="recipient.bouncedLastTime"
                class="resend-recipient__note"
              >
                {{ t('bouncedLastTime') }}
              </div>
            </div>
          </li>
        </ul>
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-px-md q-pb-md"
      >
        <m-btn
          text
          primary
          :label="t('action.cancel')"
          @click="onDialogCancel"
        />
        <m-btn
          tonal
          primary
          icon="forward_to_inbox"
          :label="t('action.send')"
          @click="onDialogOK()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

export interface ResendRecipient {
  address: string;
  // Still on the registration although the previous send to it bounced, so
  // this send will most likely fail there again.
  bouncedLastTime: boolean;
}

defineEmits([...useDialogPluginComponent.emits]);

defineProps<{
  subject: string;
  recipients: ResendRecipient[];
}>();

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
</script>

<style scoped>
.resend-card {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface);
}

.resend-title {
  font-size: 1.5rem;
  line-height: 2rem;
}

.resend-subject {
  margin-top: 4px;
  color: var(--md3-on-surface-variant);
  overflow-wrap: anywhere;
}

.resend-label {
  margin-bottom: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--md3-primary);
}

.resend-recipients {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.resend-recipient {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.resend-recipient__icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--md3-on-surface-variant);
}

.resend-recipient__text {
  min-width: 0;
}

.resend-recipient__note {
  font-size: 0.75rem;
  line-height: 1rem;
}

.resend-recipient--bounced,
.resend-recipient--bounced .resend-recipient__icon {
  color: var(--md3-error);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Send email again?'
recipients: 'Recipients'
bouncedLastTime: 'Could not be reached last time'
action:
  cancel: 'Cancel'
  send: 'Send'
</i18n>

<i18n lang="yaml" locale="de">
title: 'E-Mail erneut senden?'
recipients: 'Empfänger'
bouncedLastTime: 'War beim letzten Mal nicht erreichbar'
action:
  cancel: 'Abbrechen'
  send: 'Senden'
</i18n>

<i18n lang="yaml" locale="fr">
title: "Renvoyer l'e-mail ?"
recipients: 'Destinataires'
bouncedLastTime: "N'a pas pu être joint la dernière fois"
action:
  cancel: 'Annuler'
  send: 'Envoyer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Wysłać e-mail ponownie?'
recipients: 'Odbiorcy'
bouncedLastTime: 'Ostatnim razem nie udało się dostarczyć'
action:
  cancel: 'Anuluj'
  send: 'Wyślij'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Odeslat e-mail znovu?'
recipients: 'Příjemci'
bouncedLastTime: 'Minule se nepodařilo doručit'
action:
  cancel: 'Zrušit'
  send: 'Odeslat'
</i18n>
