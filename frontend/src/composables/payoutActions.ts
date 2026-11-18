import { copyToClipboard, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type {
  FinanceBalance,
  Payout,
  PayoutDirection,
} from '@camp-registration/common/entities';
import ConfirmDialog from '@/components/common/dialogs/ConfirmDialog.vue';
import type { ResponsiveMenuItem } from '@/types/menu';
import PayoutDialog from '@/components/event/finances/dialogs/PayoutDialog.vue';
import PayoutSignDialog from '@/components/event/finances/dialogs/PayoutSignDialog.vue';
import { usePermissions } from '@/composables/permissions';
import { usePayoutSlip } from '@/composables/payoutSlip';
import { isSigned } from '@/composables/payoutStatus';
import { useFinanceStore } from '@/stores/finance-store';
import { formatLocalDate } from '@/utils/date';

/** What the viewer may do with a payout now; absent where they may not. */
export interface PayoutActions {
  sign?: ResponsiveMenuItem | undefined;
  uploadScan?: ResponsiveMenuItem | undefined;
  scans: ResponsiveMenuItem[];
  unsign?: ResponsiveMenuItem | undefined;
  markPaid?: ResponsiveMenuItem | undefined;
  markUnpaid?: ResponsiveMenuItem | undefined;
  print: ResponsiveMenuItem;
  copyLink: ResponsiveMenuItem;
  edit?: ResponsiveMenuItem | undefined;
  remove?: ResponsiveMenuItem | undefined;
}

/**
 * Everything done to a payout, each with its own dialog or confirmation.
 * Writes go through the store, so open views follow them.
 */
export function usePayoutActions() {
  const quasar = useQuasar();
  const { t } = useI18n({ useScope: 'global' });
  const route = useRoute();
  const router = useRouter();
  const { can, canOn } = usePermissions();
  const financeStore = useFinanceStore();
  const printSlip = usePayoutSlip();

  /** "Pay out" prefills the open balance; the amount stays editable. */
  function create(
    balance: FinanceBalance,
    direction: PayoutDirection,
    onCreated?: (created: Payout) => void,
  ) {
    quasar
      .dialog({
        component: PayoutDialog,
        componentProps: { balance, direction },
      })
      .onOk((created: Payout) => onCreated?.(created));
  }

  /** The recipient reads the statement and signs it. */
  function sign(payout: Payout) {
    quasar.dialog({
      component: PayoutSignDialog,
      componentProps: { payout },
    });
  }

  function canSign(payout: Payout): boolean {
    return canOn('event.payouts.sign', payout);
  }

  /** Whether opening a link to it should go straight to signing. */
  function awaitsSignature(payout: Payout): boolean {
    return canSign(payout) && !isSigned(payout) && !payout.outdated;
  }

  /**
   * A picker per use: the camera or a PDF on phones. In the document while
   * open, since a detached input may be collected or never fire `change`
   * while a slow camera app is in front.
   */
  function pickScan(payout: Payout) {
    document.querySelector('[data-test="payout-scan-input"]')?.remove();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.hidden = true;
    input.dataset.test = 'payout-scan-input';
    input.addEventListener(
      'change',
      () => {
        const file = input.files?.[0];
        input.remove();
        if (file) {
          financeStore.attachPayoutScan(payout, file).catch(() => undefined);
        }
      },
      { once: true },
    );
    input.addEventListener('cancel', () => input.remove(), { once: true });
    document.body.append(input);
    input.click();
  }

  function unsign(payout: Payout) {
    quasar
      .dialog({
        component: ConfirmDialog,
        componentProps: {
          title: t('finance.statement.unsign.title', { label: payout.label }),
          message: t('finance.statement.unsign.message'),
          okLabel: t('finance.statement.unsign.ok'),
          color: 'negative',
        },
      })
      .onOk(() => {
        financeStore.unsignPayout(payout.id).catch(() => undefined);
      });
  }

  /** The transfer is made: today, editable afterwards like any date. */
  function setPaidOn(payout: Payout, paidOn: string | null) {
    financeStore.updatePayout(payout.id, { paidOn }).catch(() => undefined);
  }

  /** `?tab=balances&payout=<id>` opens it, e.g. to sign on another device. */
  async function copyLink(payout: Payout) {
    const { href } = router.resolve({
      name: 'management.event.finances',
      params: route.params,
      query: { tab: 'balances', payout: payout.id },
    });
    try {
      await copyToClipboard(window.location.origin + href);
      quasar.notify({
        type: 'positive',
        message: t('finance.payout.linkCopied'),
        icon: 'assignment_turned_in',
      });
    } catch {
      quasar.notify({
        type: 'negative',
        message: t('finance.payout.linkFailed'),
      });
    }
  }

  function edit(payout: Payout) {
    quasar.dialog({
      component: PayoutDialog,
      componentProps: { payout },
    });
  }

  /**
   * Undoing a payout that was paid removes a record of real money: only for
   * a recording error, and with the slip printed first.
   */
  function remove(payout: Payout) {
    quasar
      .dialog({
        component: ConfirmDialog,
        componentProps: {
          title: t('finance.payout.delete.title', { label: payout.label }),
          message: payout.paidOn
            ? t('finance.payout.delete.messagePaid')
            : t('finance.payout.delete.message'),
          okLabel: t('finance.payout.delete.ok'),
          color: 'negative',
        },
      })
      .onOk(() => {
        financeStore.deletePayout(payout.id).catch(() => undefined);
      });
  }

  function actionsFor(payout: Payout): PayoutActions {
    const editable = can('event.payouts.edit');
    const signed = isSigned(payout);
    const action = (
      allowed: boolean,
      label: string,
      icon: string,
      onClick: () => void,
    ): ResponsiveMenuItem | undefined =>
      allowed ? { label, icon, onClick } : undefined;

    return {
      // One way at a time: a signature is removed before signing anew.
      sign: action(
        !signed && !payout.outdated && canSign(payout),
        t('finance.statement.sign'),
        'draw',
        () => sign(payout),
      ),
      // A scan may take further pages.
      uploadScan: action(
        editable && payout.signedAt === null && !payout.outdated,
        t('finance.statement.uploadScan'),
        'document_scanner',
        () => pickScan(payout),
      ),
      scans: payout.files.map((file, index) => ({
        label:
          payout.files.length > 1
            ? `${t('finance.statement.openScan')} ${(index + 1).toString()}`
            : t('finance.statement.openScan'),
        icon: 'description',
        onClick: () => window.open(file.url, '_blank', 'noopener'),
      })),
      unsign: action(
        signed && editable,
        t('finance.statement.unsign.action'),
        'edit_off',
        () => unsign(payout),
      ),
      markPaid: action(
        !payout.paidOn && editable,
        t('finance.payout.markPaid'),
        'task_alt',
        () => setPaidOn(payout, formatLocalDate(new Date())),
      ),
      markUnpaid: action(
        !!payout.paidOn && editable,
        t('finance.payout.markUnpaid'),
        'undo',
        () => setPaidOn(payout, null),
      ),
      print: {
        label: t('finance.action.printSlip'),
        icon: 'print',
        onClick: () => printSlip(payout),
      },
      copyLink: {
        label: t('finance.payout.copyLink'),
        icon: 'link',
        onClick: () => void copyLink(payout),
      },
      edit: action(editable, t('finance.payout.editTitle'), 'edit', () =>
        edit(payout),
      ),
      remove: action(
        can('event.payouts.delete'),
        t('finance.action.undoPayout'),
        'delete',
        () => remove(payout),
      ),
    };
  }

  return { create, sign, awaitsSignature, actionsFor };
}
