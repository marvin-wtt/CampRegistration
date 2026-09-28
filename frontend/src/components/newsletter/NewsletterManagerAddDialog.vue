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
          <q-select
            v-model="role"
            :label="t('input.role.label')"
            :options="roleOptions"
            emit-value
            map-options
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
import { computed, ref } from 'vue';
import type { NewsletterManagerCreateData } from '@camp-registration/common/entities';
import type { NewsletterManagerRole } from '@camp-registration/common/permissions';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();
defineEmits([...useDialogPluginComponent.emits]);

const email = ref('');
const role = ref<NewsletterManagerRole>('EDITOR');

const roleOptions = computed(() => [
  { label: t('input.role.options.OWNER'), value: 'OWNER' },
  { label: t('input.role.options.EDITOR'), value: 'EDITOR' },
  { label: t('input.role.options.VIEWER'), value: 'VIEWER' },
]);

function onSubmit() {
  const data: NewsletterManagerCreateData = {
    email: email.value,
    role: role.value,
  };
  onDialogOK(data);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Add Manager'
input:
  email:
    label: 'Email'
    rule:
      required: 'Email is required'
  role:
    label: 'Role'
    options:
      OWNER: 'Owner'
      EDITOR: 'Editor'
      VIEWER: 'Viewer'
action:
  add: 'Add'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Verwalter hinzufügen'
input:
  email:
    label: 'E-Mail'
    rule:
      required: 'E-Mail ist erforderlich'
  role:
    label: 'Rolle'
    options:
      OWNER: 'Eigentümer'
      EDITOR: 'Redakteur'
      VIEWER: 'Betrachter'
action:
  add: 'Hinzufügen'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Ajouter un gestionnaire'
input:
  email:
    label: 'E-mail'
    rule:
      required: "L'e-mail est requis"
  role:
    label: 'Rôle'
    options:
      OWNER: 'Propriétaire'
      EDITOR: 'Éditeur'
      VIEWER: 'Lecteur'
action:
  add: 'Ajouter'
  cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Dodaj zarządzającego'
input:
  email:
    label: 'E-mail'
    rule:
      required: 'E-mail jest wymagany'
  role:
    label: 'Rola'
    options:
      OWNER: 'Właściciel'
      EDITOR: 'Redaktor'
      VIEWER: 'Obserwator'
action:
  add: 'Dodaj'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Přidat správce'
input:
  email:
    label: 'E-mail'
    rule:
      required: 'E-mail je povinný'
  role:
    label: 'Role'
    options:
      OWNER: 'Vlastník'
      EDITOR: 'Editor'
      VIEWER: 'Pozorovatel'
action:
  add: 'Přidat'
  cancel: 'Zrušit'
</i18n>

<style scoped></style>
