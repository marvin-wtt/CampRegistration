import { useQuasar } from 'quasar';
import type {
  Payment,
  RegistrationFee,
} from '@camp-registration/common/entities';
import RegistrationFeeDialog from '@/components/event/finances/fees/dialogs/RegistrationFeeDialog.vue';
import RecordPaymentDialog from '@/components/event/finances/fees/dialogs/RecordPaymentDialog.vue';
import RefundPaymentDialog from '@/components/event/finances/fees/dialogs/RefundPaymentDialog.vue';
import AmountDueDialog from '@/components/event/finances/fees/dialogs/AmountDueDialog.vue';

/** The fees view's dialogs; the details dialog opens the others on top. */
export function useFeeDialogs() {
  const quasar = useQuasar();

  function details(fee: RegistrationFee) {
    quasar.dialog({
      component: RegistrationFeeDialog,
      componentProps: { fee },
    });
  }

  function record(fee: RegistrationFee) {
    quasar.dialog({ component: RecordPaymentDialog, componentProps: { fee } });
  }

  function refund(payment: Payment, fee?: RegistrationFee) {
    quasar.dialog({
      component: RefundPaymentDialog,
      componentProps: { payment, fee },
    });
  }

  function amountDue(fee: RegistrationFee) {
    quasar.dialog({ component: AmountDueDialog, componentProps: { fee } });
  }

  return { details, record, refund, amountDue };
}
