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
          {{ t('page.title') }}
        </q-card-section>

        <q-card-section v-if="props.countries.length > 0">
          <country-select
            v-model="country"
            :label="t('field.country')"
            :countries="props.countries"
            rounded
            outlined
          />
        </q-card-section>

        <q-card-section class="col">
          <registration-email-editor
            v-model="selectedSubject"
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
        </q-card-section>

        <q-card-section class="col-grow">
          <registration-email-editor
            v-model="selectedBody"
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
import { computed, reactive, ref } from 'vue';
import RegistrationEmailEditor from 'components/campManagement/contact/RegistrationEmailEditor.vue';
import type { CampDetails } from '@camp-registration/common/entities';
import CountrySelect from 'components/common/CountrySelect.vue';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();

defineEmits([...useDialogPluginComponent.emits]);

const props = defineProps<{
  subject: string | Record<string, string>;
  body: string | Record<string, string>;
  form: CampDetails['form'];
  countries: string[];
}>();

const country = ref<string>(props.countries[0]!);

const selectedSubject = computed<string>({
  get: (): string =>
    typeof props.subject === 'string'
      ? props.subject
      : (props.subject[country.value] ?? ''),
  set: (value: string) =>
    typeof message.subject === 'string'
      ? (message.subject = value)
      : (message.subject[country.value] = value),
});

const selectedBody = computed<string>({
  get: (): string =>
    typeof props.body === 'string'
      ? props.body
      : (props.body[country.value] ?? ''),
  set: (value: string) =>
    typeof message.body === 'string'
      ? (message.body = value)
      : (message.body[country.value] = value),
});

const message = reactive({
  subject: props.subject ?? '',
  body: props.body ?? '',
});

function onSave() {
  // TODO Validate all translations
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
    placeholder: ''
    rule:
      required: 'The subject is required'
  body:
    label: 'Message:'
    placeholder: ''
    rule:
      required: 'The message is required'

page:
  title: 'Edit email template'
</i18n>
