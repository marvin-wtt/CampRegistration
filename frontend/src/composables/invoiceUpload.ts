import { useQuasar } from 'quasar';
import type {
  AdminEventBill,
  InvoiceCreateData,
} from '@camp-registration/common/entities';
import InvoiceUploadDialog from '@/components/billing/InvoiceUploadDialog.vue';
import { useAPIService } from '@/services/APIService';
import { useServiceNotifications } from '@/composables/serviceHandler';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { billedTo } from '@/utils/billing';

/** Uploads a bill's invoice PDF through the upload dialog. */
export function useInvoiceUpload() {
  const quasar = useQuasar();
  const api = useAPIService();
  const { to } = useObjectTranslation();
  const { withProgressNotification } = useServiceNotifications('billing');

  function pickInvoice(bill: AdminEventBill, onUploaded: () => void) {
    quasar
      .dialog({
        component: InvoiceUploadDialog,
        componentProps: {
          subject: `${to(bill.eventName)} · ${billedTo(bill)}`,
          notifies: bill.status === 'OPEN' && bill.grossAmount !== '0.00',
        },
      })
      .onOk((data: InvoiceCreateData) => {
        void withProgressNotification('uploadInvoice', () =>
          api.createInvoice(bill.id, data),
        ).then(
          onUploaded,
          // Already reported by the progress notification.
          () => undefined,
        );
      });
  }

  return { pickInvoice };
}
