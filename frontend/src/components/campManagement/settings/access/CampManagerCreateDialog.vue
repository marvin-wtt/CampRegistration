<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-form
        @submit="onInvite"
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
            autocomplete="email"
            :rules="[(val?: string) => !!val || t('input.email.rule.required')]"
            hide-bottom-space
            autofocus
            rounded
            outlined
          />

          <q-checkbox
            v-if="expiresAt === null"
            v-model="expiresAt"
            :label="t('input.showExpiresAt')"
            :true-value="date"
            :false-value="null"
          />

          <date-time-input
            v-else
            v-model="expiresAt"
            :label="t('input.expiresAt')"
            clearable
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
            :label="t('action.invite')"
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
import DateTimeInput from 'components/common/inputs/DateTimeInput.vue';
import type { CampManagerCreateData } from '@camp-registration/common/entities';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();

const { date } = defineProps<{
  date: string;
}>();
defineEmits([...useDialogPluginComponent.emits]);

const email = ref<string>('');
const expiresAt = ref<string | null>(null);

function onInvite() {
  const data: CampManagerCreateData = {
    email: email.value,
    expiresAt: expiresAt.value ?? undefined,
  };

  onDialogOK(data);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Grant Access'

input:
  email:
    label: 'Email'
    rule:
      required: 'The email is required'
  expiresAt: 'Expiration Date'
  showExpiresAt: 'Set access expiration'

action:
  invite: 'Invite'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zugriff gewähren'

input:
  email:
    label: 'E-Mail'
    rule:
      required: 'Die E-Mail ist erforderlich'
  expiresAt: 'Ablaufdatum'
  showExpiresAt: 'Zugriffsbeschränkung festlegen'

action:
  invite: 'Einladen'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: "Accorder l'accès"

input:
  email:
    label: 'E-Mail'
    rule:
      required: "L'e-mail est obligatoire"
  expiresAt: "Date d'expiration"
  showExpiresAt: "Définir une expiration de l'accès"

action:
  invite: 'Inviter'
  cancel: 'Annuler'
</i18n>
