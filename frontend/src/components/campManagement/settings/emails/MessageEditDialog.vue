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
        <q-card-section class="text-h5">
          {{ t('page.title', { name: props.name }) }}
        </q-card-section>

        <q-card-section class="row no-wrap">
          <q-list
            v-if="
              typeof message.subject !== 'string' &&
              typeof message.body !== 'string'
            "
            bordered
            outlined
            separator
            dense
            class="col"
          >
            <q-expansion-item
              v-for="(country, i) in props.countries"
              :key="country"
              group="country"
              :default-opened="i === 0"
            >
              <template #header>
                <q-item-section avatar>
                  <country-icon
                    :country="country"
                    size="sm"
                  />
                </q-item-section>
                <q-item-section>
                  {{ t('country.' + country) }}
                </q-item-section>
              </template>

              <template #default>
                <q-card class="column no-wrap">
                  <q-card-section class="col">
                    <registration-email-editor
                      v-model="message.subject[country]!"
                      :label="t('field.subject.label')"
                      :placeholder="t('field.subject.placeholder')"
                      :rules="[
                        (val?: string) =>
                          !!val || t('field.subject.rule.required'),
                        (val: string) =>
                          val.trim() !== '<p></p>' ||
                          t('field.subject.rule.required'),
                      ]"
                      hide-bottom-space
                      :form
                      single-line
                      outlined
                      rounded
                    />
                  </q-card-section>

                  <q-card-section class="col-grow">
                    <registration-email-editor
                      v-model="message.body[country]!"
                      :label="t('field.body.label')"
                      :placeholder="t('field.body.placeholder')"
                      :rules="[
                        (val?: string) =>
                          !!val || t('field.body.rule.required'),
                        (val: string) =>
                          val.trim() !== '<p></p>' ||
                          t('field.body.rule.required'),
                      ]"
                      hide-bottom-space
                      :form
                      outlined
                      rounded
                    />
                  </q-card-section>
                </q-card>
              </template>
            </q-expansion-item>
          </q-list>

          <div
            v-if="
              typeof message.subject === 'string' &&
              typeof message.body === 'string'
            "
            class="col-grow column no-wrap q-gutter-sm"
          >
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
            />
          </div>

          <div
            v-if="props.countries.length > 1"
            class="col-shrink self-center q-ml-sm"
          >
            <translation-toggle-btn
              :model-value="translated"
              @click="toggleTranslations"
            />
          </div>
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
import { computed, reactive, toRaw } from 'vue';
import RegistrationEmailEditor from 'components/campManagement/contact/RegistrationEmailEditor.vue';
import type { CampDetails } from '@camp-registration/common/entities';
import CountryIcon from 'components/common/localization/CountryIcon.vue';
import TranslationToggleBtn from 'components/common/inputs/TranslationToggleBtn.vue';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();

defineEmits([...useDialogPluginComponent.emits]);

const props = defineProps<{
  name: string;
  subject: string | Record<string, string>;
  body: string | Record<string, string>;
  form: CampDetails['form'];
  countries: string[];
}>();

const message = reactive({
  subject: structuredClone(toRaw(props.subject)),
  body: structuredClone(toRaw(props.body)),
});

const translated = computed<boolean>(() => {
  return (
    typeof message.subject !== 'string' && typeof message.body !== 'string'
  );
});

function toggleTranslations() {
  if (translated.value) {
    message.subject = defaultString(props.subject);
    message.body = defaultString(props.body);
  } else {
    message.subject = defaultObject(props.subject);
    message.body = defaultObject(props.body);

    // Set empty string as default value
    for (const country in props.countries) {
      message.subject[country] = message.subject[country] ?? '';
      message.body[country] = message.body[country] ?? '';
    }
  }
}

function defaultObject(
  value: string | Record<string, string>,
): Record<string, string> {
  return typeof value === 'string' ? {} : value;
}

function defaultString(value: string | Record<string, string>): string {
  return typeof value === 'string' ? value : '';
}

function onSave() {
  onDialogOK(message);
}

// TODO translate
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
  title: 'Edit template "{ name }"'
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
  title: 'Vorlage "{ name }" bearbeiten'
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
  title: 'Modifier le modèle "{ name }"'
</i18n>
