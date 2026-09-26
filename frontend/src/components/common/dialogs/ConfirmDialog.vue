<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card style="min-width: 320px">
      <q-card-section>
        <div
          class="text-h6"
          data-testid="title"
        >
          {{ title }}
        </div>
      </q-card-section>

      <q-card-section
        class="q-pt-none"
        data-testid="message"
      >
        {{ message }}
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
          data-testid="cancel"
          @click="onDialogCancel"
        />
        <q-btn
          :label="okLabel ?? t('action.confirm')"
          :color="color ?? 'primary'"
          rounded
          data-testid="submit"
          @click="onDialogOK"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();

defineProps<{
  title: string;
  message: string;
  okLabel?: string;
  color?: string;
}>();

defineEmits([...useDialogPluginComponent.emits]);
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
action:
  confirm: 'Confirm'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
action:
  confirm: 'Bestätigen'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  confirm: 'Confirmer'
  cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
action:
  confirm: 'Potwierdź'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  confirm: 'Potvrdit'
  cancel: 'Zrušit'
</i18n>
