<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">
          {{ props.title }}
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        {{ props.message }}
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          v-model="email"
          type="email"
          autocomplete="email"
          :label="t('input.email')"
          autofocus
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

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();

interface Props {
  title: string;
  message: string;
}

const props = defineProps<Props>();
defineEmits([...useDialogPluginComponent.emits]);

const email = ref<string>('');

function onInvite() {
  onDialogOK(email.value);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
input:
  email: 'Email'

action:
  invite: 'Invite'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
input:
  email: 'E-Mail'

action:
  invite: 'Einladen'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
input:
  email: 'E-Mail'

action:
  invite: 'Inviter'
  cancel: 'Annuler'
</i18n>
