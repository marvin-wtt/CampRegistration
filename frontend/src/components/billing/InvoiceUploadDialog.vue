<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="invoice-upload-card">
      <q-form @submit="onSubmit">
        <q-card-section class="q-pb-none">
          <div class="text-h6">{{ t('title') }}</div>
          <div class="text-caption text-on-surface-variant">{{ subject }}</div>
        </q-card-section>

        <q-card-section class="column q-gutter-y-sm">
          <file-input
            v-model="files"
            :label="t('field.file')"
            accept="application/pdf"
            max-files="1"
            color="primary"
            outlined
            rounded
          />
          <div class="text-caption text-on-surface-variant">
            {{ notifies ? t('hint.notify') : t('hint.silent') }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            :label="t('action.cancel')"
            color="primary"
            flat
            rounded
            no-caps
            @click="onDialogCancel"
          />
          <q-btn
            :label="t('action.save')"
            :disable="!fileId"
            type="submit"
            color="primary"
            unelevated
            rounded
            no-caps
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { InvoiceCreateData } from '@camp-registration/common/entities';
import FileInput, {
  type FileInputModel,
} from '@/components/common/inputs/FileInput.vue';

const { subject, notifies } = defineProps<{
  subject: string;
  /** Saving emails the organization's administrators. */
  notifies: boolean;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();

const files = ref<FileInputModel[]>([]);

/** Set once the temporary upload has finished. */
const fileId = computed(() => files.value[0]?.id);

function onSubmit() {
  if (!fileId.value) {
    return;
  }

  onDialogOK({ fileId: fileId.value } satisfies InvoiceCreateData);
}
</script>

<style scoped lang="scss">
.invoice-upload-card {
  width: 440px;
  max-width: 90vw;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Upload invoice'
field:
  file: 'Invoice (PDF)'
hint:
  notify: "The organization's administrators are emailed that the invoice is ready."
  silent: 'Nothing is owed on this bill, so no email is sent.'
action:
  cancel: 'Cancel'
  save: 'Save'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Rechnung hochladen'
field:
  file: 'Rechnung (PDF)'
hint:
  notify: 'Die Administratoren der Organisation erhalten eine E-Mail, dass die Rechnung vorliegt.'
  silent: 'Auf diese Rechnung ist nichts zu zahlen, daher wird keine E-Mail versendet.'
action:
  cancel: 'Abbrechen'
  save: 'Speichern'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Téléverser la facture'
field:
  file: 'Facture (PDF)'
hint:
  notify: "Les administrateurs de l'organisation sont informés par e-mail que la facture est disponible."
  silent: "Rien n'est dû sur cette facture, aucun e-mail n'est donc envoyé."
action:
  cancel: 'Annuler'
  save: 'Enregistrer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Prześlij fakturę'
field:
  file: 'Faktura (PDF)'
hint:
  notify: 'Administratorzy organizacji otrzymają e-mail, że faktura jest gotowa.'
  silent: 'Na tym rachunku nie ma nic do zapłaty, więc e-mail nie zostanie wysłany.'
action:
  cancel: 'Anuluj'
  save: 'Zapisz'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Nahrát fakturu'
field:
  file: 'Faktura (PDF)'
hint:
  notify: 'Správci organizace obdrží e-mail, že je faktura připravena.'
  silent: 'Na tomto vyúčtování není nic k úhradě, proto se e-mail neodešle.'
action:
  cancel: 'Zrušit'
  save: 'Uložit'
</i18n>
