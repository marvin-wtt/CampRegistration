<template>
  <responsive-dialog
    ref="dialogRef"
    :snap-points="['full']"
    @hide="onDialogHide"
  >
    <q-card
      class="check-card column no-wrap"
      :class="sheet ? 'check-card--sheet' : 'rounded-xl'"
      :flat="sheet"
    >
      <m-toolbar class="check-toolbar q-px-sm">
        <q-icon
          name="outgoing_mail"
          size="sm"
          class="q-mx-sm"
        />
        <q-toolbar-title class="text-subtitle1 text-weight-medium">
          {{ t('title') }}
        </q-toolbar-title>
        <m-btn
          v-close-popup
          class="header-btn"
          dense
          text
          round
          icon="close"
          @click="onDialogCancel"
        >
          <q-tooltip>{{ t('action.close') }}</q-tooltip>
        </m-btn>
      </m-toolbar>

      <div class="check-content col">
        <div class="check-summary">
          <div class="check-stat rounded-lg">
            <div class="check-stat__value">{{ recipients.length }}</div>
            <div class="check-stat__label">
              {{ t('stat.recipients', recipients.length) }}
            </div>
          </div>
          <div class="check-stat rounded-lg">
            <div class="check-stat__value">{{ emailCount }}</div>
            <div class="check-stat__label">
              {{ t('stat.emails', emailCount) }}
            </div>
          </div>
        </div>

        <div
          v-if="withoutEmail.length > 0"
          class="check-warning rounded-lg"
          data-test="send-check-without-email"
        >
          <q-icon
            name="warning_amber"
            size="20px"
            class="check-warning__icon"
          />
          <div>
            <div class="text-weight-medium">
              {{ t('withoutEmail.title', withoutEmail.length) }}
            </div>
            <div class="check-warning__names">{{ withoutEmailNames }}</div>
          </div>
        </div>

        <section
          v-if="sampleOptions.length > 0"
          class="check-preview"
        >
          <div class="check-preview__header">
            <div class="check-preview__title">{{ t('preview.title') }}</div>
            <q-select
              v-model="sampleId"
              :options="sampleOptions"
              :label="t('preview.as')"
              emit-value
              map-options
              options-dense
              dense
              outlined
              rounded
              class="check-preview__sample"
            />
          </div>

          <div
            v-if="previewLoading"
            class="check-preview__skeleton"
          >
            <q-skeleton
              type="text"
              width="60%"
            />
            <q-skeleton
              type="rect"
              height="120px"
              class="rounded-lg"
            />
          </div>
          <div
            v-else-if="previewProblem === 'invalid'"
            class="check-warning check-warning--error rounded-lg"
            data-test="send-check-invalid"
          >
            <q-icon
              name="error_outline"
              size="20px"
              class="check-warning__icon"
            />
            <div>{{ t('preview.invalid') }}</div>
          </div>
          <div
            v-else-if="previewProblem === 'failed'"
            class="check-preview__error"
          >
            {{ t('preview.error') }}
          </div>
          <message-details-content
            v-else-if="previewMessage"
            :message="previewMessage"
            :registrations="recipients"
          />
        </section>
      </div>

      <div class="check-actions">
        <m-btn
          text
          primary
          no-caps
          :label="t('action.edit')"
          @click="onDialogCancel"
        />
        <m-btn
          primary
          no-caps
          icon-right="send"
          :label="t('action.send', emailCount)"
          :disable="emailCount === 0 || previewProblem === 'invalid'"
          data-test="send-check-confirm"
          @click="onDialogOK()"
        />
      </div>
    </q-card>
  </responsive-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type {
  Message,
  MessagePreview,
  Registration,
  ServiceFile,
} from '@camp-registration/common/entities';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { MToolbar } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eToolbar';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import MessageDetailsContent from '@/components/event/contact/MessageDetailsContent.vue';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { isAPIServiceError, useAPIService } from '@/services/APIService';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { formatPersonName } from '@/utils/formatters';

defineEmits([...useDialogPluginComponent.emits]);

const { recipients, subject, body, replyTo, attachments } = defineProps<{
  recipients: Registration[];
  subject: string;
  body: string;
  replyTo: string;
  attachments: ServiceFile[];
}>();

const { t } = useI18n();
const quasar = useQuasar();
const apiService = useAPIService();
const eventDetailsStore = useEventDetailsStore();
const { emails, fullName } = useRegistrationHelper();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

// Mirrors ResponsiveDialog's switch to a bottom sheet.
const sheet = computed<boolean>(() => quasar.screen.lt.sm);

// The server sends once per distinct address of each registration.
const emailCount = computed<number>(() =>
  recipients.reduce((sum, r) => sum + new Set(emails(r)).size, 0),
);

const withoutEmail = computed<Registration[]>(() =>
  recipients.filter((r) => emails(r).length === 0),
);

const withoutEmailNames = computed<string>(() => {
  const names = withoutEmail.value.map((r) => formatPersonName(fullName(r)));
  const shown = names.slice(0, 5).join(', ');
  return names.length > 5
    ? `${shown} ${t('withoutEmail.more', { count: names.length - 5 })}`
    : shown;
});

const sampleOptions = computed(() =>
  recipients
    .filter((r) => emails(r).length > 0)
    .map((r) => ({ label: formatPersonName(fullName(r)), value: r.id })),
);

const sampleId = ref<string | null>(sampleOptions.value[0]?.value ?? null);
const preview = ref<MessagePreview | null>(null);
const previewLoading = ref<boolean>(false);
// `invalid`: a placeholder is broken, so the message renders for nobody.
const previewProblem = ref<'invalid' | 'failed' | null>(null);

// Only the latest request may land; switching samples quickly races.
let request = 0;

watch(
  sampleId,
  async (registrationId) => {
    const eventId = eventDetailsStore.data?.id;
    if (!registrationId || !eventId) {
      return;
    }
    const current = ++request;
    previewLoading.value = true;
    previewProblem.value = null;
    try {
      const result = await apiService.previewMessage(eventId, {
        registrationId,
        subject,
        body,
      });
      if (current === request) {
        preview.value = result;
      }
    } catch (error) {
      if (current === request) {
        previewProblem.value =
          isAPIServiceError(error) && error.response?.status === 400
            ? 'invalid'
            : 'failed';
      }
    } finally {
      if (current === request) {
        previewLoading.value = false;
      }
    }
  },
  { immediate: true },
);

// Shaped as a sent message so it reads exactly like one in the history.
const previewMessage = computed<Message | null>(() => {
  if (!preview.value || !sampleId.value) {
    return null;
  }
  return {
    id: 'preview',
    subject: preview.value.subject,
    body: preview.value.body,
    replyTo: replyTo || null,
    priority: 'normal',
    attachments,
    recipients: [{ registrationId: sampleId.value, deliveries: [] }],
    sentBy: null,
    createdAt: null,
  };
});
</script>

<style scoped>
.check-card {
  width: min(720px, 95vw);
  max-width: 95vw;
  max-height: 88vh;
  background: var(--md3-surface-container-low);
  overflow: hidden;
}

/* The sheet draws the surface and sets the height. */
.check-card--sheet {
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  background: transparent;
}

.check-toolbar {
  background: transparent;
}

.header-btn {
  color: var(--md3-on-surface-variant);
}

.check-content {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 16px;
  padding: 4px 24px 16px;
  overflow-y: auto;
}

.check-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.check-stat {
  padding: 12px 16px;
  background: var(--md3-surface-container-high);
}

.check-stat__value {
  color: var(--md3-on-surface);
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.15;
}

.check-stat__label {
  color: var(--md3-on-surface-variant);
  font-size: 0.8125rem;
}

.check-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  color: var(--md3-on-warning-container);
  background: var(--md3-warning-container);
}

.check-warning__icon {
  flex: 0 0 auto;
  color: var(--md3-warning);
}

.check-warning--error {
  color: var(--md3-on-error-container);
  background: var(--md3-error-container);
}

.check-warning--error .check-warning__icon {
  color: var(--md3-error);
}

.check-warning__names {
  font-size: 0.8125rem;
  overflow-wrap: anywhere;
}

.check-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.check-preview__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
}

.check-preview__title {
  color: var(--md3-on-surface-variant);
  font-size: 0.8125rem;
  font-weight: 500;
}

.check-preview__sample {
  min-width: 200px;
}

.check-preview__skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.check-preview__error {
  color: var(--md3-on-surface-variant);
  font-size: 0.875rem;
}

.check-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
}

.check-card--sheet .check-actions {
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}

@media (max-width: 599px) {
  .check-content {
    padding: 0 16px 16px;
  }

  .check-preview__sample {
    width: 100%;
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Check before sending'
stat:
  recipients: 'recipient | recipients'
  emails: 'email | emails'
withoutEmail:
  title: '{n} recipient has no email address and won’t get this | {n} recipients have no email address and won’t get this'
  more: 'and {count} more'
preview:
  title: 'Preview'
  as: 'As received by'
  invalid: "A placeholder is broken, for example an {'{{#if}}'} without {'{{/if}}'}. Check the subject and the text before sending."
  error: 'The preview could not be loaded. You can still send the message.'
action:
  close: 'Close'
  edit: 'Keep editing'
  send: 'Send | Send {n} email | Send {n} emails'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Vor dem Senden prüfen'
stat:
  recipients: 'Empfänger | Empfänger'
  emails: 'E-Mail | E-Mails'
withoutEmail:
  title: '{n} Empfänger hat keine E-Mail-Adresse und erhält die Nachricht nicht | {n} Empfänger haben keine E-Mail-Adresse und erhalten die Nachricht nicht'
  more: 'und {count} weitere'
preview:
  title: 'Vorschau'
  as: 'Ansicht für'
  invalid: "Ein Platzhalter ist fehlerhaft, z. B. ein {'{{#if}}'} ohne {'{{/if}}'}. Prüfe Betreff und Text vor dem Senden."
  error: 'Die Vorschau konnte nicht geladen werden. Du kannst die Nachricht trotzdem senden.'
action:
  close: 'Schließen'
  edit: 'Weiter bearbeiten'
  send: 'Senden | {n} E-Mail senden | {n} E-Mails senden'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Vérifier avant l’envoi'
stat:
  recipients: 'destinataire | destinataires'
  emails: 'e-mail | e-mails'
withoutEmail:
  title: '{n} destinataire n’a pas d’adresse e-mail et ne recevra pas ce message | {n} destinataires n’ont pas d’adresse e-mail et ne recevront pas ce message'
  more: 'et {count} autres'
preview:
  title: 'Aperçu'
  as: 'Tel que reçu par'
  invalid: "Un espace réservé est incorrect, par exemple un {'{{#if}}'} sans {'{{/if}}'}. Vérifiez l’objet et le texte avant l’envoi."
  error: 'L’aperçu n’a pas pu être chargé. Vous pouvez tout de même envoyer le message.'
action:
  close: 'Fermer'
  edit: 'Continuer la rédaction'
  send: 'Envoyer | Envoyer {n} e-mail | Envoyer {n} e-mails'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Sprawdź przed wysłaniem'
stat:
  recipients: 'odbiorca | odbiorców'
  emails: 'e-mail | e-maili'
withoutEmail:
  title: 'Odbiorcy bez adresu e-mail nie otrzymają wiadomości: {n} | Odbiorcy bez adresu e-mail nie otrzymają wiadomości: {n}'
  more: 'i {count} więcej'
preview:
  title: 'Podgląd'
  as: 'Widok dla'
  invalid: "Symbol zastępczy jest błędny, np. {'{{#if}}'} bez {'{{/if}}'}. Sprawdź temat i treść przed wysłaniem."
  error: 'Nie udało się wczytać podglądu. Nadal możesz wysłać wiadomość.'
action:
  close: 'Zamknij'
  edit: 'Edytuj dalej'
  send: 'Wyślij | Wyślij e-maile: {n} | Wyślij e-maile: {n}'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Zkontrolovat před odesláním'
stat:
  recipients: 'příjemce | příjemců'
  emails: 'e-mail | e-mailů'
withoutEmail:
  title: 'Příjemci bez e-mailové adresy zprávu nedostanou: {n} | Příjemci bez e-mailové adresy zprávu nedostanou: {n}'
  more: 'a {count} dalších'
preview:
  title: 'Náhled'
  as: 'Pohled pro'
  invalid: "Zástupný symbol je chybný, např. {'{{#if}}'} bez {'{{/if}}'}. Před odesláním zkontroluj předmět a text."
  error: 'Náhled se nepodařilo načíst. Zprávu přesto můžeš odeslat.'
action:
  close: 'Zavřít'
  edit: 'Upravovat dál'
  send: 'Odeslat | Odeslat e-maily: {n} | Odeslat e-maily: {n}'
</i18n>
