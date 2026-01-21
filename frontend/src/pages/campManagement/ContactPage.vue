<template>
  <page-state-handler
    :error
    :loading
    class="relative-position"
  >
    <q-form
      ref="formRef"
      class="absolute fit column q-gutter-y-sm q-pa-md"
      @submit="send()"
      @reset="reset()"
    >
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

      <expand-slide
        expand-label="Show more"
        contract-label="Show less"
      >
        <div class="row q-mt-none q-gutter-sm">
          <q-input
            v-model="replyTo"
            type="email"
            :label="t('input.replyTo.label')"
            :disable="sendInProgress"
            class="col-grow"
            outlined
            rounded
            dense
          />

          <q-select
            v-model="priority"
            :label="t('input.priority')"
            :options="priorityOptions"
            :disable="sendInProgress"
            class="col-xs-12 col-sm-2"
            emit-value
            map-options
            outlined
            rounded
            dense
          />
        </div>
      </expand-slide>

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

      <registration-email-editor
        v-model="text"
        :label="t('input.message.label')"
        :form="campDetailsStore.data?.form"
        :rules="[
          (val?: string) =>
            (!!val && val.length > 0) || t('input.message.rule.required'),
        ]"
        hide-bottom-space
        :disable="sendInProgress"
        class="col-grow"
        rounded
        outlined
      />

      <div class="row q-gutter-sm justify-between">
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
          class="col-xs-12 col-sm-auto"
          style="max-width: 600px"
          @rejected="onAttachmentRejected"
        >
          <template #prepend>
            <q-icon name="attach_file" />
          </template>
        </file-input>

        <q-btn
          :label="t('action.send')"
          :loading="sendInProgress"
          type="submit"
          icon="send"
          color="primary"
          class="col-xs-12 col-sm-auto"
          rounded
        />
      </div>
    </q-form>
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useRegistrationsStore } from 'stores/registration-store';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ContactSelect from 'components/campManagement/contact/ContactSelect.vue';
import type {
  Registration,
  ServiceFile,
} from '@camp-registration/common/entities';
import type { Contact } from 'components/campManagement/contact/Contact';
import { QForm, type QSelectOption, useQuasar } from 'quasar';
import { type QRejectedEntry } from 'quasar';
import ExpandSlide from 'components/common/ExpandSlide.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import RegistrationEmailEditor from 'components/campManagement/contact/RegistrationEmailEditor.vue';
import { useServiceNotifications } from 'src/composables/serviceHandler';
import { useAPIService } from 'src/services/APIService';
import FileInput from 'components/common/inputs/FileInput.vue';

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
});

const formRef = ref<QForm>();
const to = ref<Contact[]>([]);
const replyTo = ref<string>();
const subject = ref<string>('');
const attachments = ref<ServiceFile[]>([]);
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
  return registrationStore.error;
});

const loading = computed<boolean>(() => {
  return registrationStore.isLoading;
});

const registrations = computed<Registration[]>(() => {
  return registrationStore.data ?? [];
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
      return 'error.attachment.default';
  }
}

async function send() {
  const campId = campDetailsStore.data?.id;
  if (!campId) {
    return;
  }

  if (attachments.value?.find((value) => value.id == undefined)) {
    quasar.notify({
      type: 'warning',
      message: t('error.attachment.ongoing'),
    });
    return;
  }

  sendInProgress.value = true;
  try {
    // TODO Add error messages
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
        attachmentIds: attachments.value?.map((file) => file.id),
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

  formRef.value?.resetValidation();
}

// TODO Add pl and cs translations
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
action:
  send: 'Send'

error:
  attachment:
    ongoing: 'Waiting for file uploads to finish. Please try again later.'
    default: 'File not allowed'
    duplicate: 'File already exists'
    filter: 'File type not allowed'
    maxFiles: 'Too many files'
    maxFileSize: 'File(s) too large. Maximum file size is 20 MB'

input:
  attachments: 'Attachments:'
  message:
    label: 'Message:'
    required: 'A message is required'
  priority: 'Priority:'
  replyTo:
    label: 'Reply To:'
    required: 'A reply-to address is required'
  subject:
    label: 'Subject:'
    rule:
      required: 'A subject is required'
  to:
    label: 'To:'
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
error:
  attachment:
    ongoing: 'Warten auf den Abschluss des Datei-Uploads. Bitte später erneut versuchen.'
    default: 'Datei nicht erlaubt'
    duplicate: 'Datei existiert bereits'
    filter: 'Dateityp nicht erlaubt'
    maxFiles: 'Zu viele Dateien'
    maxFileSize: 'Datei(en) zu groß. Maximale Dateigröße beträgt 20 MB'

input:
  attachments: 'Anhänge:'
  message:
    label: 'Nachricht:'
    required: 'Eine Nachricht ist erforderlich'
  priority: 'Priorität:'
  replyTo:
    label: 'Antwort an:'
    required: 'Eine Antwortadresse ist erforderlich'
  subject:
    label: 'Betreff:'
    rule:
      required: 'Ein Betreff ist erforderlich'
  to:
    label: 'An:'
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
error:
  attachment:
    ongoing: 'En attente de la fin du téléchargement des fichiers. Veuillez réessayer plus tard.'
    default: 'Fichier non autorisé'
    duplicate: 'Fichier déjà existant'
    filter: 'Type de fichier non autorisé'
    maxFiles: 'Trop de fichiers'
    maxFileSize: 'Fichier(s) trop volumineux. La taille maximale est de 20 Mo'

input:
  attachments: 'Pièces jointes:'
  message:
    label: 'Message:'
    required: 'Un message est requis'
  priority: 'Priorité:'
  replyTo:
    label: 'Répondre à:'
    required: 'Une adresse de réponse est requise'
  subject:
    label: 'Objet:'
    rule:
      required: 'Un objet est requis'
  to:
    label: 'À:'
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
