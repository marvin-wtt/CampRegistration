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
            v-model="name"
            :label="t('input.name.label')"
            :rules="[(val?: string) => !!val || t('input.name.rule.required')]"
            hide-bottom-space
            autofocus
            rounded
            outlined
          />
          <q-input
            v-model="description"
            :label="t('input.description.label')"
            type="textarea"
            rows="3"
            rounded
            outlined
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
            :label="t('action.create')"
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
import type { NewsletterCreateData } from '@camp-registration/common/entities';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();
defineEmits([...useDialogPluginComponent.emits]);

const name = ref('');
const description = ref('');

function onSubmit() {
  const data: NewsletterCreateData = {
    name: name.value,
    description: description.value || null,
  };
  onDialogOK(data);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Create Newsletter'
input:
  name:
    label: 'Name'
    rule:
      required: 'Name is required'
  description:
    label: 'Description (optional)'
action:
  create: 'Create'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Newsletter erstellen'
input:
  name:
    label: 'Name'
    rule:
      required: 'Name ist erforderlich'
  description:
    label: 'Beschreibung (optional)'
action:
  create: 'Erstellen'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Créer une newsletter'
input:
  name:
    label: 'Nom'
    rule:
      required: 'Le nom est requis'
  description:
    label: 'Description (optionnel)'
action:
  create: 'Créer'
  cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Utwórz newsletter'
input:
  name:
    label: 'Nazwa'
    rule:
      required: 'Nazwa jest wymagana'
  description:
    label: 'Opis (opcjonalny)'
action:
  create: 'Utwórz'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Vytvořit newsletter'
input:
  name:
    label: 'Název'
    rule:
      required: 'Název je povinný'
  description:
    label: 'Popis (volitelný)'
action:
  create: 'Vytvořit'
  cancel: 'Zrušit'
</i18n>

<style scoped></style>
