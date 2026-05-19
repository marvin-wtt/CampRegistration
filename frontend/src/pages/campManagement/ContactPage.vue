<template>
  <page-state-handler
    :error
    :loading
    class="relative-position"
  >
    <q-form
      ref="formRef"
      class="absolute fit column q-pa-md q-gutter-y-sm"
      @submit="send()"
      @reset="reset()"
    >
      <!-- ── Header: recipient + optional fields + subject ── -->
      <div class="column q-gutter-y-xs">
        <contact-select
          v-model="to"
          :label="t('input.to.label')"
          :registrations
          :rules="[
            (val?: Contact[]) =>
              (!!val && val.length > 0) || t('input.to.rule.required'),
          ]"
          hide-bottom-space
          :disable="sendInProgress"
          outlined
          rounded
          dense
        />

        <div class="row items-start q-gutter-x-xs">
          <q-input
            v-model="replyTo"
            type="email"
            :label="t('input.replyTo.label')"
            :rules="[
              (val?: string) => !!val || t('input.replyTo.required'),
              (val?: string) =>
                !val ||
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ||
                t('input.replyTo.rule.invalid'),
            ]"
            hide-bottom-space
            :disable="sendInProgress"
            outlined
            rounded
            dense
            class="col"
          >
            <template
              v-if="suggestedReplyTo && suggestedReplyTo !== replyTo"
              #append
            >
              <q-btn
                icon="autorenew"
                size="xs"
                flat
                round
                :disable="sendInProgress"
                @click.stop="replyTo = suggestedReplyTo"
              >
                <q-tooltip>
                  {{ t('input.replyTo.suggestion', { email: suggestedReplyTo }) }}
                </q-tooltip>
              </q-btn>
            </template>
          </q-input>

          <q-select
            v-model="priority"
            :options="priorityOptions"
            :disable="sendInProgress"
            outlined
            rounded
            dense
            emit-value
            map-options
            class="priority-select"
          >
            <template #prepend>
              <q-icon
                :name="priorityIcon"
                :color="priorityColor"
                size="xs"
              />
            </template>
          </q-select>
        </div>

        <registration-email-editor
          v-model="subject"
          :label="t('input.subject.label')"
          :form="campDetailsStore.data?.form"
          :rules="[
            (val?: string) =>
              (!!val && val.length > 0) || t('input.subject.rule.required'),
          ]"
          hide-bottom-space
          :disable="sendInProgress"
          rounded
          outlined
          single-line
          plain-text
        />
      </div>

      <q-separator />

      <!-- ── Body: message editor fills remaining space ── -->
      <registration-email-editor
        v-model="text"
        :label="t('input.message.label')"
        :form="campDetailsStore.data?.form"
        :rules="[
          (val?: string) =>
            (!!val && val.length > 0) || t('input.message.required'),
        ]"
        hide-bottom-space
        :disable="sendInProgress"
        class="col-grow"
        rounded
        outlined
      />

      <div
        class="row items-center q-gutter-xs"
        style="flex-wrap: wrap"
      >
        <file-input
          v-model="attachments"
          :label="t('input.attachments')"
          :disable="sendInProgress"
          max-file-size="20000000"
          max-total-size="20000000"
          multiple
          append
          use-chips
          outlined
          rounded
          dense
          style="flex: 1 0 auto; max-width: 100%"
          @rejected="onAttachmentRejected"
        >
          <template #prepend>
            <q-icon name="attach_file" />
          </template>
        </file-input>

        <q-btn
          :label="sendLabel"
          :loading="sendInProgress"
          type="submit"
          icon="send"
          color="primary"
          rounded
          style="margin-left: auto"
        />
      </div>
    </q-form>
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useRegistrationsStore } from 'stores/registration-store';
import { computed, nextTick, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ContactSelect from 'components/campManagement/contact/ContactSelect.vue';
import type { Registration } from '@camp-registration/common/entities';
import type { Contact } from 'components/campManagement/contact/Contact';
import { QForm, type QSelectOption, useQuasar } from 'quasar';
import { type QRejectedEntry } from 'quasar';
import { useCampDetailsStore } from 'stores/camp-details-store';
import RegistrationEmailEditor from 'components/campManagement/contact/RegistrationEmailEditor.vue';
import { useServiceNotifications } from 'src/composables/serviceHandler';
import { useAPIService } from 'src/services/APIService';
import FileInput, {
  type FileInputModel,
} from 'components/common/inputs/FileInput.vue';

const quasar = useQuasar();
const { t } = useI18n();

const apiService = useAPIService();
const registrationStore = useRegistrationsStore();
const campDetailsStore = useCampDetailsStore();
const { withResultNotification } = useServiceNotifications();

onMounted(async () => {
  await Promise.all([
    campDetailsStore.fetchData(),
    registrationStore.fetchData(),
  ]);
  replyTo.value = defaultReplyTo();
});

const formRef = ref<QForm>();
const to = ref<Contact[]>([]);
const replyTo = ref<string>('');
const suggestedReplyTo = computed(() => defaultReplyTo());

const recipientCountries = computed(() => {
  const extractRegistrationCountry = (r: Registration) => {
    return r.computedData.address.country;
  };

  return to.value
    .flatMap((contact) =>
      contact.type === 'group'
        ? contact.registrations.map(extractRegistrationCountry)
        : [extractRegistrationCountry(contact.registration)],
    )
    .filter((c): c is string => c != null);
});

function defaultReplyTo(): string {
  const contactEmail = campDetailsStore.data?.contactEmail;
  if (!contactEmail) {
    return '';
  }
  if (typeof contactEmail === 'string') {
    return contactEmail;
  }

  const countries = recipientCountries.value;
  if (countries.length > 0) {
    const freq = new Map<string, number>();
    for (const c of countries) {
      freq.set(c, (freq.get(c) ?? 0) + 1);
    }
    const dominant = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]![0];
    if (contactEmail[dominant]) {
      return contactEmail[dominant];
    }
  }

  return Object.values(contactEmail)[0] ?? '';
}

const subject = ref<string>('');
const attachments = ref<FileInputModel[]>([]);
const priority = ref<'high' | 'normal' | 'low'>('normal');
const text = ref<string>('');
const sendInProgress = ref<boolean>(false);

const priorityOptions = computed<QSelectOption[]>(() => [
  {
    label: t('priority.low'),
    value: 'low',
  },
  {
    label: t('priority.normal'),
    value: 'normal',
  },
  {
    label: t('priority.high'),
    value: 'high',
  },
]);

const error = computed<string | null>(() => {
  return registrationStore.error ?? campDetailsStore.error;
});

const loading = computed<boolean>(() => {
  return registrationStore.isLoading || campDetailsStore.isLoading;
});

const registrations = computed<Registration[]>(() => {
  return registrationStore.data ?? [];
});

const recipientCount = computed<number>(() => {
  const ids = new Set<string>();
  to.value.forEach((contact) => {
    if (contact.type === 'group') {
      contact.registrations.forEach((r: Registration) => ids.add(r.id));
    } else {
      ids.add(contact.registration.id);
    }
  });
  return ids.size;
});

const priorityIcon = computed<string>(() => {
  switch (priority.value) {
    case 'high':
      return 'keyboard_double_arrow_up';
    case 'low':
      return 'keyboard_double_arrow_down';
    default:
      return 'remove';
  }
});

const priorityColor = computed<string | undefined>(() => {
  switch (priority.value) {
    case 'high':
      return 'negative';
    case 'low':
      return 'grey';
    default:
      return undefined;
  }
});

const sendLabel = computed<string>(() => {
  if (recipientCount.value > 0) {
    return t('action.sendTo', { count: recipientCount.value });
  }
  return t('action.send');
});

function onAttachmentRejected(entities: QRejectedEntry[]) {
  entities.forEach((entity: QRejectedEntry) => {
    quasar.notify({
      type: 'negative',
      group: 'error.attachment',
      message: getAttachmentErrorTranslated(entity),
      caption: entity.file.name,
    });
  });
}

function getAttachmentErrorTranslated(entity: QRejectedEntry): string {
  switch (entity.failedPropValidation) {
    case 'duplicate':
      return t('error.attachment.duplicate');
    case 'max-file-size':
    case 'max-total-size':
      return t('error.attachment.maxFileSize');
    case 'filter':
      return t('error.attachment.filter');
    case 'max-files':
      return t('error.attachment.maxFiles');
    default:
      return t('error.attachment.default');
  }
}

async function send() {
  const campId = campDetailsStore.data?.id;
  if (!campId) {
    quasar.notify({
      type: 'negative',
      message: t('error.campNotLoaded'),
    });
    return;
  }

  if (attachments.value?.find((value) => value.id === undefined)) {
    quasar.notify({
      type: 'warning',
      message: t('error.attachment.ongoing'),
    });
    return;
  }

  sendInProgress.value = true;
  try {
    await withResultNotification('send', async () => {
      return apiService.createMessage(campId, {
        registrationIds: to.value.flatMap((contact) => {
          return contact.type === 'group'
            ? contact.registrations.map((r: Registration) => r.id)
            : contact.registration.id;
        }),
        replyTo: replyTo.value,
        subject: subject.value,
        body: text.value,
        priority: priority.value,
        attachmentIds: attachments.value
          ?.filter((v) => v.id !== undefined)
          .map((file) => file.id),
      });
    });

    // Reset all fields on success
    reset();
  } finally {
    sendInProgress.value = false;
  }
}

function reset() {
  to.value = [];
  subject.value = '';
  text.value = '';
  priority.value = 'normal';
  replyTo.value = defaultReplyTo();
  attachments.value = [];

  void nextTick(() => formRef.value?.resetValidation());
}
</script>

<style scoped>
.priority-select {
  min-width: 110px;
}
</style>

<i18n lang="yaml" locale="en">
action:
  send: 'Send'
  sendTo: 'Send ({count})'

error:
  campNotLoaded: 'Camp details could not be loaded. Please reload the page.'
  attachment:
    ongoing: 'Waiting for file uploads to finish. Please try again later.'
    default: 'File not allowed'
    duplicate: 'File already exists'
    filter: 'File type not allowed'
    maxFiles: 'Too many files'
    maxFileSize: 'File(s) too large. Maximum file size is 20 MB'

input:
  attachments: 'Attachments'
  message:
    label: 'Message'
    required: 'A message is required'
  priority: 'Priority'
  replyTo:
    label: 'Reply To'
    required: 'A reply-to address is required'
    suggestion: 'Use suggested address: {email}'
    rule:
      invalid: 'Please enter a valid email address'
  subject:
    label: 'Subject'
    rule:
      required: 'A subject is required'
  to:
    label: 'To'
    rule:
      required: 'At least one contact is required'

priority:
  high: 'High'
  low: 'Low'
  normal: 'Normal'

request:
  send:
    error: 'Failed to send message'
    success: 'Message sent successfully'
</i18n>

<i18n lang="yaml" locale="de">
action:
  send: 'Senden'
  sendTo: 'Senden ({count})'

error:
  campNotLoaded: 'Camp-Details konnten nicht geladen werden. Bitte Seite neu laden.'
  attachment:
    ongoing: 'Warten auf den Abschluss des Datei-Uploads. Bitte später erneut versuchen.'
    default: 'Datei nicht erlaubt'
    duplicate: 'Datei existiert bereits'
    filter: 'Dateityp nicht erlaubt'
    maxFiles: 'Zu viele Dateien'
    maxFileSize: 'Datei(en) zu groß. Maximale Dateigröße beträgt 20 MB'

input:
  attachments: 'Anhänge'
  message:
    label: 'Nachricht'
    required: 'Eine Nachricht ist erforderlich'
  priority: 'Priorität'
  replyTo:
    label: 'Antwort an'
    required: 'Eine Antwortadresse ist erforderlich'
    suggestion: 'Vorschlag verwenden: {email}'
    rule:
      invalid: 'Bitte gib eine gültige E-Mail-Adresse ein'
  subject:
    label: 'Betreff'
    rule:
      required: 'Ein Betreff ist erforderlich'
  to:
    label: 'An'
    rule:
      required: 'Mindestens ein Kontakt ist erforderlich'

priority:
  high: 'Hoch'
  low: 'Niedrig'
  normal: 'Normal'

request:
  send:
    error: 'Nachricht konnte nicht gesendet werden'
    success: 'Nachricht erfolgreich gesendet'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  send: 'Envoyer'
  sendTo: 'Envoyer ({count})'

error:
  campNotLoaded: "Les détails du camp n'ont pas pu être chargés. Veuillez recharger la page."
  attachment:
    ongoing: 'En attente de la fin du téléchargement des fichiers. Veuillez réessayer plus tard.'
    default: 'Fichier non autorisé'
    duplicate: 'Fichier déjà existant'
    filter: 'Type de fichier non autorisé'
    maxFiles: 'Trop de fichiers'
    maxFileSize: 'Fichier(s) trop volumineux. La taille maximale est de 20 Mo'

input:
  attachments: 'Pièces jointes'
  message:
    label: 'Message'
    required: 'Un message est requis'
  priority: 'Priorité'
  replyTo:
    label: 'Répondre à'
    required: 'Une adresse de réponse est requise'
    suggestion: 'Utiliser l''adresse suggérée : {email}'
    rule:
      invalid: 'Veuillez entrer une adresse e-mail valide'
  subject:
    label: 'Objet'
    rule:
      required: 'Un objet est requis'
  to:
    label: 'À'
    rule:
      required: 'Au moins un contact est requis'

priority:
  high: 'Élevée'
  low: 'Basse'
  normal: 'Normale'

request:
  send:
    error: "Échec de l'envoi du message"
    success: 'Message envoyé avec succès'
</i18n>

<i18n lang="yaml" locale="pl">
action:
  send: 'Wyślij'
  sendTo: 'Wyślij ({count})'

error:
  campNotLoaded: 'Nie udało się załadować danych obozu. Proszę odświeżyć stronę.'
  attachment:
    ongoing: 'Oczekiwanie na zakończenie przesyłania plików. Spróbuj ponownie później.'
    default: 'Plik niedozwolony'
    duplicate: 'Plik już istnieje'
    filter: 'Niedozwolony typ pliku'
    maxFiles: 'Zbyt wiele plików'
    maxFileSize: 'Plik(i) są zbyt duże. Maksymalny rozmiar pliku to 20 MB'

input:
  attachments: 'Załączniki'
  message:
    label: 'Wiadomość'
    required: 'Wiadomość jest wymagana'
  priority: 'Priorytet'
  replyTo:
    label: 'Odpowiedź do'
    required: 'Adres do odpowiedzi jest wymagany'
    suggestion: 'Użyj sugerowanego adresu: {email}'
    rule:
      invalid: 'Proszę wprowadzić poprawny adres e-mail'
  subject:
    label: 'Temat'
    rule:
      required: 'Temat jest wymagany'
  to:
    label: 'Do'
    rule:
      required: 'Wymagany jest co najmniej jeden kontakt'

priority:
  high: 'Wysoki'
  low: 'Niski'
  normal: 'Normalny'

request:
  send:
    error: 'Nie udało się wysłać wiadomości'
    success: 'Wiadomość została wysłana pomyślnie'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  send: 'Odeslat'
  sendTo: 'Odeslat ({count})'

error:
  campNotLoaded: 'Nepodařilo se načíst údaje o táboře. Prosím obnovte stránku.'
  attachment:
    ongoing: 'Čeká se na dokončení nahrávání souborů. Zkuste to prosím později.'
    default: 'Soubor není povolen'
    duplicate: 'Soubor již existuje'
    filter: 'Nepovolený typ souboru'
    maxFiles: 'Příliš mnoho souborů'
    maxFileSize: 'Soubor(y) jsou příliš velké. Maximální velikost souboru je 20 MB'

input:
  attachments: 'Přílohy'
  message:
    label: 'Zpráva'
    required: 'Zpráva je povinná'
  priority: 'Priorita'
  replyTo:
    label: 'Odpovědět na'
    required: 'Adresa pro odpověď je povinná'
    suggestion: 'Použít navrhovanou adresu: {email}'
    rule:
      invalid: 'Prosím zadejte platnou e-mailovou adresu'
  subject:
    label: 'Předmět'
    rule:
      required: 'Předmět je povinný'
  to:
    label: 'Komu'
    rule:
      required: 'Je vyžadován alespoň jeden kontakt'

priority:
  high: 'Vysoká'
  low: 'Nízká'
  normal: 'Normální'

request:
  send:
    error: 'Odeslání zprávy se nezdařilo'
    success: 'Zpráva byla úspěšně odeslána'
</i18n>
