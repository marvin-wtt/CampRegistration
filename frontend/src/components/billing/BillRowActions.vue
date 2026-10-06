<template>
  <row-actions :actions />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type {
  AdminEventBill,
  EventBillUpdateData,
} from '@camp-registration/common/entities';
import RowActions, {
  type RowAction,
} from '@/components/administration/RowActions.vue';
import EventBillDialog, {
  type EventBillDialogResult,
} from '@/components/billing/EventBillDialog.vue';
import { useAPIService } from '@/services/APIService';
import { useServiceNotifications } from '@/composables/serviceHandler';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useInvoiceUpload } from '@/composables/invoiceUpload';
import { formatMoney } from '@/utils/money';
import { billedTo, canUploadInvoice, isInvoiced } from '@/utils/billing';

/** An administrator's actions on one bill; every change asks for a note. */
const { bill } = defineProps<{
  bill: AdminEventBill;
}>();

const emit = defineEmits<{
  changed: [];
}>();

const { t, locale } = useI18n();
const { to } = useObjectTranslation();
const quasar = useQuasar();
const api = useAPIService();
const { withProgressNotification } = useServiceNotifications('billing');
const { pickInvoice } = useInvoiceUpload();

const actions = computed<RowAction[]>(() => [
  {
    key: 'paid',
    label: t('action.paid'),
    icon: 'paid',
    color: 'positive',
    hidden: bill.status !== 'OPEN',
    handler: () => update('PAID'),
  },
  {
    key: 'void',
    label: t('action.void'),
    icon: 'block',
    color: 'negative',
    hidden: bill.status !== 'OPEN' && bill.status !== 'PAID',
    handler: () => update('VOID'),
  },
  {
    key: 'correct',
    label: t('action.correct'),
    icon: 'edit',
    separatorBefore: true,
    // An invoice states the amount; the backend refuses to change it.
    hidden: bill.status !== 'OPEN' || isInvoiced(bill),
    handler: correct,
  },
  {
    key: 'rebill',
    label: t('action.rebill'),
    icon: 'autorenew',
    color: 'primary',
    hidden: bill.status !== 'VOID' || bill.replacedByBillId !== null,
    handler: rebill,
  },
  {
    key: 'invoice',
    label: t('action.uploadInvoice'),
    icon: 'upload_file',
    hidden: !canUploadInvoice(bill),
    handler: () => pickInvoice(bill, () => emit('changed')),
  },
  {
    key: 'note',
    label: t('action.note'),
    icon: 'edit_note',
    separatorBefore: bill.status !== 'DRAFT',
    handler: () => update(),
  },
]);

const subject = computed(() => `${to(bill.eventName)} · ${billedTo(bill)}`);
const measured = computed(() =>
  Math.max(bill.startRegistrationCount, bill.endRegistrationCount ?? 0),
);

function run(operation: string, fn: () => Promise<unknown>) {
  void withProgressNotification(operation, fn).then(
    () => emit('changed'),
    // Already reported by the progress notification.
    () => undefined,
  );
}

function correct() {
  quasar
    .dialog({
      component: EventBillDialog,
      componentProps: {
        mode: 'correct',
        subject: subject.value,
        measured: measured.value,
        adjusted: bill.adjustedRegistrationCount,
        note: bill.note,
      },
    })
    .onOk((result: EventBillDialogResult) => {
      run('updateBill', () =>
        api.updateBill(bill.id, {
          adjustedRegistrationCount: result.adjustedRegistrationCount,
          note: result.note,
        }),
      );
    });
}

function rebill() {
  quasar
    .dialog({
      component: EventBillDialog,
      componentProps: {
        mode: 'rebill',
        subject: subject.value,
        measured: measured.value,
        adjusted: bill.adjustedRegistrationCount,
      },
    })
    .onOk((result: EventBillDialogResult) => {
      run('createBill', () =>
        api.createBill({
          replacesBillId: bill.id,
          ...(result.priceModelId ? { priceModelId: result.priceModelId } : {}),
          ...(result.adjustedRegistrationCount !== null
            ? { adjustedRegistrationCount: result.adjustedRegistrationCount }
            : {}),
          note: result.note,
        }),
      );
    });
}

/** The note is the bill's only record of why it changed. */
function update(newStatus?: 'PAID' | 'VOID') {
  quasar
    .dialog({
      title: newStatus
        ? t(`dialog.${newStatus}.title`)
        : t('dialog.note.title'),
      ...(newStatus
        ? {
            message: t(`dialog.${newStatus}.message`, {
              amount: formatMoney(
                bill.grossAmount,
                bill.currency,
                locale.value,
              ),
            }),
          }
        : {}),
      prompt: {
        model: bill.note ?? '',
        type: 'textarea',
        label: t('dialog.note.label'),
        color: 'primary',
        outlined: true,
        rounded: true,
      },
      cancel: {
        label: t('dialog.cancel'),
        color: 'primary',
        flat: true,
        rounded: true,
      },
      ok: {
        label: t('dialog.confirm'),
        color: newStatus === 'VOID' ? 'negative' : 'primary',
        rounded: true,
      },
    })
    .onOk((note: string) => {
      const data: EventBillUpdateData = {
        ...(newStatus ? { status: newStatus } : {}),
        note: note.trim() || null,
      };

      run('updateBill', () => api.updateBill(bill.id, data));
    });
}
</script>

<i18n lang="yaml" locale="en">
action:
  paid: 'Mark as paid'
  void: 'Void'
  correct: 'Correct registrations'
  rebill: 'Bill again'
  note: 'Edit note'
  uploadInvoice: 'Upload invoice'
dialog:
  PAID:
    title: 'Mark as paid'
    message: 'Record the payment of {amount}.'
  VOID:
    title: 'Void bill'
    message: 'The bill of {amount} will no longer be owed. This cannot be undone.'
  note:
    title: 'Note'
    label: 'Note (optional)'
  cancel: 'Cancel'
  confirm: 'Save'
</i18n>

<i18n lang="yaml" locale="de">
action:
  paid: 'Als bezahlt markieren'
  void: 'Stornieren'
  correct: 'Anmeldungen korrigieren'
  rebill: 'Neu abrechnen'
  note: 'Notiz bearbeiten'
  uploadInvoice: 'Rechnung hochladen'
dialog:
  PAID:
    title: 'Als bezahlt markieren'
    message: 'Zahlung über {amount} erfassen.'
  VOID:
    title: 'Rechnung stornieren'
    message: 'Die Rechnung über {amount} ist dann nicht mehr geschuldet. Das kann nicht rückgängig gemacht werden.'
  note:
    title: 'Notiz'
    label: 'Notiz (optional)'
  cancel: 'Abbrechen'
  confirm: 'Speichern'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  paid: 'Marquer comme payée'
  void: 'Annuler'
  correct: 'Corriger les inscriptions'
  rebill: 'Facturer à nouveau'
  note: 'Modifier la note'
  uploadInvoice: 'Téléverser la facture'
dialog:
  PAID:
    title: 'Marquer comme payée'
    message: 'Enregistrer le paiement de {amount}.'
  VOID:
    title: 'Annuler la facture'
    message: 'La facture de {amount} ne sera plus due. Cette action est irréversible.'
  note:
    title: 'Note'
    label: 'Note (facultative)'
  cancel: 'Annuler'
  confirm: 'Enregistrer'
</i18n>

<i18n lang="yaml" locale="pl">
action:
  paid: 'Oznacz jako opłacony'
  void: 'Anuluj'
  correct: 'Popraw liczbę zgłoszeń'
  rebill: 'Rozlicz ponownie'
  note: 'Edytuj notatkę'
  uploadInvoice: 'Prześlij fakturę'
dialog:
  PAID:
    title: 'Oznacz jako opłacony'
    message: 'Zarejestruj płatność w kwocie {amount}.'
  VOID:
    title: 'Anuluj rachunek'
    message: 'Rachunek na {amount} nie będzie już należny. Tej operacji nie można cofnąć.'
  note:
    title: 'Notatka'
    label: 'Notatka (opcjonalnie)'
  cancel: 'Anuluj'
  confirm: 'Zapisz'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  paid: 'Označit jako zaplacenou'
  void: 'Stornovat'
  correct: 'Opravit přihlášky'
  rebill: 'Vyúčtovat znovu'
  note: 'Upravit poznámku'
  uploadInvoice: 'Nahrát fakturu'
dialog:
  PAID:
    title: 'Označit jako zaplacenou'
    message: 'Zaznamenat platbu {amount}.'
  VOID:
    title: 'Stornovat fakturu'
    message: 'Faktura na {amount} již nebude splatná. Tuto akci nelze vrátit zpět.'
  note:
    title: 'Poznámka'
    label: 'Poznámka (nepovinná)'
  cancel: 'Zrušit'
  confirm: 'Uložit'
</i18n>
