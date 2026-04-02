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
            v-model="email"
            :label="t('input.email.label')"
            type="email"
            :rules="[(val?: string) => !!val || t('input.email.rule.required')]"
            hide-bottom-space
            autofocus
            rounded
            outlined
          />
          <q-input
            v-model="name"
            :label="t('input.name.label')"
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
            :label="t('action.add')"
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
import type { NewsletterSubscriberCreateData } from '@camp-registration/common/entities';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();
defineEmits([...useDialogPluginComponent.emits]);

const email = ref('');
const name = ref('');

function onSubmit() {
  const data: NewsletterSubscriberCreateData = {
    email: email.value,
    name: name.value || null,
  };
  onDialogOK(data);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Add Subscriber'
input:
  email:
    label: 'Email'
    rule:
      required: 'Email is required'
  name:
    label: 'Name (optional)'
action:
  add: 'Add'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Abonnent hinzufügen'
input:
  email:
    label: 'E-Mail'
    rule:
      required: 'E-Mail ist erforderlich'
  name:
    label: 'Name (optional)'
action:
  add: 'Hinzufügen'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Ajouter un abonné'
input:
  email:
    label: 'E-mail'
    rule:
      required: "L'e-mail est requis"
  name:
    label: 'Nom (optionnel)'
action:
  add: 'Ajouter'
  cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Dodaj subskrybenta'
input:
  email:
    label: 'E-mail'
    rule:
      required: 'E-mail jest wymagany'
  name:
    label: 'Imię i nazwisko (opcjonalne)'
action:
  add: 'Dodaj'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Přidat odběratele'
input:
  email:
    label: 'E-mail'
    rule:
      required: 'E-mail je povinný'
  name:
    label: 'Jméno (volitelné)'
action:
  add: 'Přidat'
  cancel: 'Zrušit'
</i18n>

<style scoped></style>
