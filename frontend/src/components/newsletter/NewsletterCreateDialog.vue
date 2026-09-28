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
          <q-select
            v-model="organizationId"
            :label="t('input.organization.label')"
            :hint="t('input.organization.hint')"
            :options="organizationOptions"
            :rules="[
              (val?: string) => !!val || t('input.organization.rule.required'),
            ]"
            emit-value
            map-options
            hide-bottom-space
            rounded
            outlined
          />
          <q-input
            v-model="name"
            :label="t('input.name.label')"
            :rules="[(val?: string) => !!val || t('input.name.rule.required')]"
            hide-bottom-space
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
          <q-input
            v-model="replyTo"
            :label="t('input.replyTo.label')"
            type="email"
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
import { useDialogPluginComponent, type QSelectOption } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useOrganizationsStore } from '@/stores/organizations-store';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';
import type { NewsletterCreateData } from '@camp-registration/common/entities';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();
defineEmits([...useDialogPluginComponent.emits]);

const organizationsStore = useOrganizationsStore();
const { data: organizations } = storeToRefs(organizationsStore);
const { newsletterCreationOrganizationIds } = useOrganizationPermissions();

const organizationId = ref<string | null>(null);
const name = ref('');
const description = ref('');
const replyTo = ref('');

// A newsletter has no draft state, so only verified organizations qualify.
const organizationOptions = computed<QSelectOption<string>[]>(() => {
  const eligible = newsletterCreationOrganizationIds.value;

  return (organizations.value ?? [])
    .filter((organization) => eligible.includes(organization.id))
    .map((organization) => ({
      label: organization.name,
      value: organization.id,
    }));
});

function onSubmit() {
  if (!organizationId.value) {
    return;
  }

  const data: NewsletterCreateData = {
    organizationId: organizationId.value,
    name: name.value,
    description: description.value || null,
    replyTo: replyTo.value || null,
  };
  onDialogOK(data);
}

onMounted(async () => {
  await organizationsStore.fetchData();

  // Skip a pointless choice when there is only one.
  const eligible = organizationOptions.value;
  if (eligible.length === 1) {
    organizationId.value = eligible[0]!.value;
  }
});
</script>

<i18n lang="yaml" locale="en">
title: 'Create Newsletter'
input:
  organization:
    label: 'Organization'
    hint: 'Only verified organizations can send newsletters'
    rule:
      required: 'Organization is required'
  name:
    label: 'Name'
    rule:
      required: 'Name is required'
  description:
    label: 'Description (optional)'
  replyTo:
    label: 'Reply-To address (optional)'
action:
  create: 'Create'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Newsletter erstellen'
input:
  organization:
    label: 'Organisation'
    hint: 'Nur verifizierte Organisationen können Newsletter versenden'
    rule:
      required: 'Organisation ist erforderlich'
  name:
    label: 'Name'
    rule:
      required: 'Name ist erforderlich'
  description:
    label: 'Beschreibung (optional)'
  replyTo:
    label: 'Reply-To-Adresse (optional)'
action:
  create: 'Erstellen'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Créer une newsletter'
input:
  organization:
    label: 'Organisation'
    hint: 'Seules les organisations vérifiées peuvent envoyer des newsletters'
    rule:
      required: "L'organisation est requise"
  name:
    label: 'Nom'
    rule:
      required: 'Le nom est requis'
  description:
    label: 'Description (optionnel)'
  replyTo:
    label: 'Adresse de réponse (optionnel)'
action:
  create: 'Créer'
  cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Utwórz newsletter'
input:
  organization:
    label: 'Organizacja'
    hint: 'Tylko zweryfikowane organizacje mogą wysyłać newslettery'
    rule:
      required: 'Organizacja jest wymagana'
  name:
    label: 'Nazwa'
    rule:
      required: 'Nazwa jest wymagana'
  description:
    label: 'Opis (opcjonalny)'
  replyTo:
    label: 'Adres odpowiedzi (opcjonalny)'
action:
  create: 'Utwórz'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Vytvořit newsletter'
input:
  organization:
    label: 'Organizace'
    hint: 'Newslettery mohou posílat jen ověřené organizace'
    rule:
      required: 'Organizace je povinná'
  name:
    label: 'Název'
    rule:
      required: 'Název je povinný'
  description:
    label: 'Popis (volitelný)'
  replyTo:
    label: 'Adresa pro odpověď (volitelná)'
action:
  create: 'Vytvořit'
  cancel: 'Zrušit'
</i18n>

<style scoped></style>
