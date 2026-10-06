<template>
  <invoice-links
    v-if="bill.invoices.length > 0"
    :invoices="bill.invoices"
    :owner="{ billId: bill.id }"
    removable
    @remove="confirmDelete"
  />
  <q-btn
    v-else-if="canUploadInvoice(bill)"
    :label="t('action.uploadInvoice')"
    icon="upload_file"
    color="primary"
    size="sm"
    flat
    dense
    rounded
    no-caps
    class="q-px-sm"
    @click="pickInvoice(bill, () => emit('changed'))"
  />
  <span
    v-else
    class="text-on-surface-variant"
  >
    —
  </span>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type {
  AdminEventBill,
  Invoice,
} from '@camp-registration/common/entities';
import InvoiceLinks from '@/components/billing/InvoiceLinks.vue';
import { useAPIService } from '@/services/APIService';
import { useServiceNotifications } from '@/composables/serviceHandler';
import { useInvoiceUpload } from '@/composables/invoiceUpload';
import { canUploadInvoice } from '@/utils/billing';

/** A bill's invoices for administrators: download, delete or upload. */
const { bill } = defineProps<{
  bill: AdminEventBill;
}>();

const emit = defineEmits<{
  changed: [];
}>();

const { t } = useI18n();
const quasar = useQuasar();
const api = useAPIService();
const { withProgressNotification } = useServiceNotifications('billing');
const { pickInvoice } = useInvoiceUpload();

function confirmDelete(invoice: Invoice) {
  quasar
    .dialog({
      title: t('dialog.deleteInvoice.title'),
      message: t('dialog.deleteInvoice.message'),
      cancel: {
        label: t('dialog.cancel'),
        color: 'primary',
        flat: true,
        rounded: true,
      },
      ok: {
        label: t('dialog.deleteInvoice.confirm'),
        color: 'negative',
        rounded: true,
      },
    })
    .onOk(() => {
      void withProgressNotification('deleteInvoice', () =>
        api.deleteInvoice(bill.id, invoice.id),
      ).then(
        () => emit('changed'),
        // Already reported by the progress notification.
        () => undefined,
      );
    });
}
</script>

<i18n lang="yaml" locale="en">
action:
  uploadInvoice: 'Upload invoice'
dialog:
  deleteInvoice:
    title: 'Delete invoice'
    message: 'The uploaded invoice is removed for the organization too.'
    confirm: 'Delete'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
action:
  uploadInvoice: 'Rechnung hochladen'
dialog:
  deleteInvoice:
    title: 'Rechnung löschen'
    message: 'Die hochgeladene Rechnung wird auch für die Organisation entfernt.'
    confirm: 'Löschen'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  uploadInvoice: 'Téléverser la facture'
dialog:
  deleteInvoice:
    title: 'Supprimer la facture'
    message: "La facture téléversée est aussi retirée pour l'organisation."
    confirm: 'Supprimer'
  cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
action:
  uploadInvoice: 'Prześlij fakturę'
dialog:
  deleteInvoice:
    title: 'Usuń fakturę'
    message: 'Przesłana faktura zostanie usunięta również dla organizacji.'
    confirm: 'Usuń'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  uploadInvoice: 'Nahrát fakturu'
dialog:
  deleteInvoice:
    title: 'Smazat fakturu'
    message: 'Nahraná faktura bude odstraněna i pro organizaci.'
    confirm: 'Smazat'
  cancel: 'Zrušit'
</i18n>
