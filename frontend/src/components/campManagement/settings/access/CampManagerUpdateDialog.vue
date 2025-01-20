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
          <date-time-input
            v-model="data.expiresAt"
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
            :label="t('action.update')"
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
import { reactive } from 'vue';
import DateTimeInput from 'components/common/inputs/DateTimeInput.vue';
import type { CampManagerUpdateData } from '@camp-registration/common/entities';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();

const { expiresAt } = defineProps<{
  expiresAt: string | null;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const data = reactive<CampManagerUpdateData>({
  expiresAt,
});

function onInvite() {
  onDialogOK(data);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Grant Access'

input:
  expiresAt: 'Expiration Date'

action:
  cancel: 'Cancel'
  update: 'Update'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zugriff gewähren'

input:
  expiresAt: 'Ablaufdatum'

action:
  cancel: 'Abbrechen'
  update: 'Aktialisieren'
</i18n>

<i18n lang="yaml" locale="fr">
title: "Accorder l'accès"

input:
  expiresAt: "Date d'expiration"

action:
  cancel: 'Annuler'
  update: 'Actualiser'
</i18n>
