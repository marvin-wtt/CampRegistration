<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card
      class="q-dialog-plugin"
      style="max-width: 700px; width: 100%"
    >
      <q-form
        @submit="onSave"
        @reset="onDialogCancel"
      >
        <q-card-section>
          <div class="text-h5">
            {{ t('page.title') }}
          </div>
          <div class="text-subtitle2">
            {{ name }}
            <template v-if="country"> ({{ country }}) </template>
          </div>
        </q-card-section>

        <q-card-section class="column q-gutter-sm no-wrap">
          <registration-email-editor
            v-model="message.subject"
            :label="t('field.subject.label')"
            :placeholder="t('field.subject.placeholder')"
            :rules="[
              (val?: string) => !!val || t('field.subject.rule.required'),
              (val: string) =>
                val.trim() !== '<p></p>' || t('field.subject.rule.required'),
            ]"
            hide-bottom-space
            :form
            single-line
            outlined
            rounded
          />

          <registration-email-editor
            v-model="message.body"
            :label="t('field.body.label')"
            :placeholder="t('field.body.placeholder')"
            :rules="[
              (val?: string) => !!val || t('field.body.rule.required'),
              (val: string) =>
                val.trim() !== '<p></p>' || t('field.body.rule.required'),
            ]"
            hide-bottom-space
            :form
            outlined
            rounded
            :style="{ minHeight: '100px' }"
          />

          <q-file
            v-model="files"
            :label="t('field.attachment.label')"
            type="file"
            use-chips
            multiple
            append
            outlined
            rounded
            dense
            clearable
          >
            <template v-slot:prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>
        </q-card-section>

        <q-card-actions
          align="right"
          class="text-primary"
        >
          <q-btn
            :label="t('action.cancel')"
            type="reset"
            flat
            outline
            rounded
          />
          <q-btn
            :label="t('action.save')"
            type="submit"
            color="primary"
            rounded
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { reactive, ref } from 'vue';
import RegistrationEmailEditor from 'components/campManagement/contact/RegistrationEmailEditor.vue';
import type {
  CampDetails,
  ServiceFile,
} from '@camp-registration/common/entities';
import { deepToRaw } from 'src/utils/deepToRaw';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();

defineEmits([...useDialogPluginComponent.emits]);

const { name, subject, body, form, country, attachments, saveFn } =
  defineProps<{
    name: string;
    subject: string;
    body: string;
    attachments: ServiceFile[];
    form: CampDetails['form'];
    country: string;

    saveFn: (data: {
      subject: string;
      body: string;
      attachmentIds: string[] | null;
    }) => Promise<void>;
  }>();

const files = ref<File[] | null>(
  attachments
    ? attachments.map(
        (value) =>
          new File([], value.name, {
            type: value.type,
            lastModified: new Date(value.createdAt).getTime(),
          }),
      )
    : null,
);

const message = reactive({
  subject: structuredClone(deepToRaw(subject)),
  body: structuredClone(deepToRaw(body)),
});

async function onSave() {
  await saveFn({
    ...message,
    attachmentIds: [], // TODO
  });

  onDialogOK(message);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
action:
  save: 'Save'
  cancel: 'Cancel'

field:
  country: 'Edit template for participants from:'
  subject:
    label: 'Subject:'
    placeholder: 'Type your subject here...'
    rule:
      required: 'The subject is required'
  body:
    label: 'Message:'
    placeholder: 'Type your messages here...'
    rule:
      required: 'The message is required'

page:
  title: 'Edit template'
</i18n>

<i18n lang="yaml" locale="de">
action:
  save: 'Speichern'
  cancel: 'Abbrechen'

field:
  country: 'Vorlage bearbeiten für Teilnehmer aus:'
  subject:
    label: 'Betreff:'
    placeholder: 'Geben Sie hier Ihren Betreff ein...'
    rule:
      required: 'Der Betreff ist erforderlich'
  body:
    label: 'Nachricht:'
    placeholder: 'Geben Sie hier Ihre Nachricht ein...'
    rule:
      required: 'Die Nachricht ist erforderlich'

page:
  title: 'Vorlage bearbeiten'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  save: 'Enregistrer'
  cancel: 'Annuler'

field:
  country: 'Modifier le modèle pour les participants venant de :'
  subject:
    label: 'Objet :'
    placeholder: 'Tapez votre objet ici...'
    rule:
      required: "L'objet est requis"
  body:
    label: 'Message :'
    placeholder: 'Tapez votre message ici...'
    rule:
      required: 'Le message est requis'

page:
  title: 'Modifier modèle'
</i18n>

<i18n lang="yaml" locale="pl">
action:
  save: 'Zapisz'
  cancel: 'Anuluj'

field:
  country: 'Edytuj szablon dla uczestników z:'
  subject:
    label: 'Temat:'
    placeholder: 'Wpisz tutaj temat...'
    rule:
      required: 'Temat jest wymagany'
  body:
    label: 'Wiadomość:'
    placeholder: 'Wpisz tutaj swoją wiadomość...'
    rule:
      required: 'Wiadomość jest wymagana'

page:
  title: 'Edytuj szablon'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  save: 'Uložit'
  cancel: 'Zrušit'

field:
  country: 'Upravit šablonu pro účastníky z:'
  subject:
    label: 'Předmět:'
    placeholder: 'Zadejte zde předmět...'
    rule:
      required: 'Předmět je povinný'
  body:
    label: 'Zpráva:'
    placeholder: 'Zadejte zde svou zprávu...'
    rule:
      required: 'Zpráva je povinná'

page:
  title: 'Upravit šablonu'
</i18n>
