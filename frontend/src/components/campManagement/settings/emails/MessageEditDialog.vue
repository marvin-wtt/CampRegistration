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
          {{ t('page.title', { name }) }}
        </q-card-section>

        <q-card-section class="row no-wrap">
          <q-list
            v-if="!isString(message.subject) && !isString(message.body)"
            bordered
            outlined
            separator
            dense
            class="col"
          >
            <q-expansion-item
              v-for="(country, i) in countries"
              :key="country"
              group="country"
              :default-opened="i === 0"
            >
              <template #header>
                <q-item-section avatar>
                  <country-icon
                    :country
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
            v-if="isString(message.subject) && isString(message.body)"
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
            v-if="countries.length > 1"
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
import { computed, reactive } from 'vue';
import RegistrationEmailEditor from 'components/campManagement/contact/RegistrationEmailEditor.vue';
import type { CampDetails } from '@camp-registration/common/entities';
import CountryIcon from 'components/common/localization/CountryIcon.vue';
import TranslationToggleBtn from 'components/common/inputs/TranslationToggleBtn.vue';
import { deepToRaw } from 'src/utils/deepToRaw';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();

defineEmits([...useDialogPluginComponent.emits]);

const { name, subject, body, form, countries } = defineProps<{
  name: string;
  subject: string | Record<string, string>;
  body: string | Record<string, string>;
  form: CampDetails['form'];
  countries: string[];
}>();

const message = reactive({
  subject: structuredClone(deepToRaw(dropUnsupportedLangs(subject))),
  body: structuredClone(deepToRaw(dropUnsupportedLangs(body))),
});

const translated = computed<boolean>(() => {
  return !isString(message.subject) || !isString(message.body);
});

function isString(value: string | Record<string, string>): value is string {
  return typeof value === 'string';
}

function dropUnsupportedLangs(input: string | Record<string, string>) {
  return typeof input === 'string' ? input : buildTranslationObject(input);
}

function buildTranslationObject(
  object: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    countries.map((country) => [
      country,
      // if no value for country, take the first available value or empty string
      object[country] ?? Object.values(object)[0] ?? '',
    ]),
  );
}

function toggleTranslations() {
  if (translated.value) {
    message.subject = defaultString(subject);
    message.body = defaultString(body);
  } else {
    message.subject = defaultObject(subject);
    message.body = defaultObject(body);

    // Set empty string as default value
    for (const country of countries) {
      message.subject[country] ??= '';
      message.body[country] ??= '';
    }
  }
}

function defaultObject(
  value: string | Record<string, string>,
): Record<string, string> {
  if (typeof value === 'string') {
    return Object.fromEntries(countries.map((country) => [country, value]));
  }

  return buildTranslationObject(value);
}

function defaultString(value: string | Record<string, string>): string {
  if (typeof value === 'string') {
    return value;
  }

  return Object.values(value)[0] ?? '';
}

function onSave() {
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
