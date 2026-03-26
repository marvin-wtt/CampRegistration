<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-form
        @submit="onSubmit"
        @reset="onDialogCancel"
      >
        <q-card-section class="text-h6">
          {{ t('title') }}
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-md">
          <q-input
            v-model="campId"
            :label="t('input.campId.label')"
            :hint="t('input.campId.hint')"
            :rules="[(val?: string) => !!val || t('input.campId.rule.required')]"
            hide-bottom-space
            autofocus
            rounded
            outlined
          />
          <q-input
            v-model="country"
            :label="t('input.country.label')"
            :hint="t('input.country.hint')"
            maxlength="5"
            rounded
            outlined
            clearable
          />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-banner
            rounded
            class="bg-blue-1"
          >
            <template #avatar>
              <q-icon
                name="info"
                color="info"
              />
            </template>
            {{ t('notice') }}
          </q-banner>
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
            :label="t('action.import')"
            type="submit"
            color="primary"
            rounded
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';
import type { NewsletterSubscriberImportData } from '@camp-registration/common/entities';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();
defineEmits([...useDialogPluginComponent.emits]);

const campId = ref('');
const country = ref('');

function onSubmit() {
  const data: NewsletterSubscriberImportData = {
    campId: campId.value,
    country: country.value || null,
  };
  onDialogOK(data);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Import Subscribers from Camp'
input:
  campId:
    label: 'Camp ID'
    hint: 'The ID of the camp to import subscribers from'
    rule:
      required: 'Camp ID is required'
  country:
    label: 'Filter by Country (optional)'
    hint: 'Leave empty to import all, or enter a country code (e.g. DE, FR)'
notice: 'Only registrations with an email address will be imported. Existing subscribers will be skipped.'
action:
  import: 'Import'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Abonnenten aus Lager importieren'
input:
  campId:
    label: 'Lager-ID'
    hint: 'Die ID des Lagers, aus dem Abonnenten importiert werden sollen'
    rule:
      required: 'Lager-ID ist erforderlich'
  country:
    label: 'Nach Land filtern (optional)'
    hint: 'Leer lassen für alle, oder Ländercode eingeben (z.B. DE, FR)'
notice: 'Es werden nur Anmeldungen mit E-Mail-Adresse importiert. Bestehende Abonnenten werden übersprungen.'
action:
  import: 'Importieren'
  cancel: 'Abbrechen'
</i18n>

<style scoped></style>
