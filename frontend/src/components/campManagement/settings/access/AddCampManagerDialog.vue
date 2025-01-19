<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">
          {{ t('title') }}
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        {{ t('description') }}
      </q-card-section>

      <q-card-section class="q-pt-none q-gutter-md">
        <q-input
          v-model="email"
          type="email"
          autocomplete="email"
          :label="t('input.email')"
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
          flat
          outline
          rounded
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('action.invite')"
          color="primary"
          rounded
          @click="onInvite"
        />
      </q-card-actions>
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
  email: 'Email'
  expiresAt: 'Expiration Date'
  showExpiresAt: 'Set access expiration'

action:
  invite: 'Invite'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zugriff gewähren'

input:
  email: 'E-Mail'
  expiresAt: 'Ablaufdatum'
  showExpiresAt: 'Zugriffsbeschränkung festlegen'

action:
  invite: 'Einladen'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: "Accorder l'accès"

input:
  email: 'E-Mail'
  expiresAt: "Date d'expiration"
  showExpiresAt: "Définir une expiration de l'accès"

action:
  invite: 'Inviter'
  cancel: 'Annuler'
</i18n>
