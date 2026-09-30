<template>
  <page-state-handler :error>
    <div class="admin-page column no-wrap fit">
      <admin-list-toolbar
        v-model:search="search"
        :title="t('title')"
        :total="total"
        :loading
        :search-placeholder="t('search')"
        @refresh="reload"
      >
        <template #actions>
          <q-btn
            :label="t('action.priceModels')"
            :to="{ name: 'administration.price-models' }"
            icon="sell"
            color="primary"
            flat
            rounded
            no-caps
          />
        </template>
        <template #filters>
          <div class="col-12 col-sm-auto">
            <q-select
              v-model="status"
              :options="statusOptions"
              :label="t('column.status')"
              dense
              outlined
              rounded
              clearable
              emit-value
              map-options
              options-dense
              style="min-width: 160px"
            />
          </div>
        </template>
      </admin-list-toolbar>

      <q-table
        ref="tableRef"
        v-model:pagination="pagination"
        :loading
        :rows
        :columns
        :sort-method="identitySort"
        :rows-per-page-options="[0]"
        virtual-scroll
        :virtual-scroll-item-size="48"
        :virtual-scroll-sticky-size-start="48"
        hide-bottom
        row-key="id"
        flat
        bordered
        class="admin-table col rounded-borders"
        @virtual-scroll="onVirtualScroll"
      >
        <template #body-cell-event="props">
          <q-td :props>
            <div>{{ to(props.row.eventName) }}</div>
            <div class="text-caption text-on-surface-variant">
              {{ formatPeriod(props.row) }}
            </div>
          </q-td>
        </template>

        <template #body-cell-registrationCount="props">
          <q-td :props>
            <div>
              {{ props.row.registrationCount }}
              <q-icon
                v-if="props.row.adjustedRegistrationCount !== null"
                name="edit"
                size="xs"
                class="text-on-surface-variant"
              >
                <q-tooltip>{{ t('corrected') }}</q-tooltip>
              </q-icon>
            </div>
            <div class="text-caption text-on-surface-variant">
              {{
                t('counts', {
                  start: props.row.startRegistrationCount,
                  end: props.row.endRegistrationCount ?? '—',
                })
              }}
            </div>
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props>
            <event-bill-status-chip :status="props.row.status" />
            <q-chip
              v-if="props.row.replacedByBillId"
              :label="t('replaced')"
              icon="autorenew"
              dense
              square
              outline
            />
            <q-chip
              v-if="props.row.replacesBillId"
              :label="t('replacement')"
              icon="autorenew"
              dense
              square
              outline
            />
            <q-icon
              v-if="props.row.note"
              name="notes"
              class="q-ml-xs text-on-surface-variant"
            >
              <q-tooltip>{{ props.row.note }}</q-tooltip>
            </q-icon>
          </q-td>
        </template>

        <template #body-cell-action="props">
          <q-td
            :props
            auto-width
          >
            <row-actions :actions="actionsFor(props.row)" />
          </q-td>
        </template>
      </q-table>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar, type QTableColumn } from 'quasar';
import type {
  AdminEventBill,
  EventBillQuery,
  EventBillStatus,
  EventBillUpdateData,
} from '@camp-registration/common/entities';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import AdminListToolbar from '@/components/administration/AdminListToolbar.vue';
import RowActions, {
  type RowAction,
} from '@/components/administration/RowActions.vue';
import EventBillStatusChip from '@/components/billing/EventBillStatusChip.vue';
import EventBillDialog, {
  type EventBillDialogResult,
} from '@/components/billing/EventBillDialog.vue';
import { useAPIService } from '@/services/APIService';
import { useServerTable } from '@/composables/serverTable';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formatMoney } from '@/utils/money';
import { formatBillPeriod } from '@/utils/billing';
import { useRouteQueryParams } from '@/composables/useRouteQueryParams';

const { t, d, locale } = useI18n();
const { to } = useObjectTranslation();
const quasar = useQuasar();
const api = useAPIService();

const routeQuery = useRouteQueryParams();

const status = ref<EventBillStatus | null>(
  routeQuery.getEnumQueryParam<EventBillStatus>('status', [
    'DRAFT',
    'OPEN',
    'PAID',
    'VOID',
  ]),
);

const {
  tableRef,
  rows,
  search,
  loading,
  error,
  total,
  pagination,
  onVirtualScroll,
  identitySort,
  reload,
  withProgressNotification,
} = useServerTable<AdminEventBill, EventBillQuery>({
  storeName: 'billing',
  fetch: (query) => api.fetchBillsPaginated(query),
  buildQuery: ({ cursor, limit, search }) =>
    ({
      cursor,
      limit,
      search: search || undefined,
      status: status.value ?? undefined,
    }) as EventBillQuery,
  watchSources: [status],
});

const statusOptions = computed(() =>
  (['DRAFT', 'OPEN', 'PAID', 'VOID'] as const).map((value) => ({
    label: t(`status.${value}`),
    value,
  })),
);

const columns = computed<QTableColumn<AdminEventBill>[]>(() => [
  {
    name: 'event',
    label: t('column.event'),
    field: 'eventName',
    align: 'left',
  },
  {
    name: 'organization',
    label: t('column.organization'),
    field: (row) => row.organization.name,
    align: 'left',
  },
  {
    name: 'registrationCount',
    label: t('column.registrationCount'),
    field: 'registrationCount',
    align: 'right',
  },
  {
    name: 'grossAmount',
    label: t('column.grossAmount'),
    field: (row) => formatMoney(row.grossAmount, row.currency, locale.value),
    align: 'right',
  },
  {
    name: 'status',
    label: t('column.status'),
    field: 'status',
    align: 'left',
  },
  {
    name: 'finalizedAt',
    label: t('column.finalizedAt'),
    field: 'finalizedAt',
    align: 'left',
    format: (value: string | null) =>
      value ? d(new Date(value), 'short') : '—',
  },
  {
    name: 'action',
    label: t('column.action'),
    field: 'id',
    align: 'center',
  },
]);

function formatPeriod(bill: AdminEventBill): string {
  return formatBillPeriod(bill, locale.value);
}

function actionsFor(bill: AdminEventBill): RowAction[] {
  return [
    {
      key: 'paid',
      label: t('action.paid'),
      icon: 'paid',
      color: 'positive',
      hidden: bill.status !== 'OPEN',
      handler: () => update(bill, 'PAID'),
    },
    {
      key: 'void',
      label: t('action.void'),
      icon: 'block',
      color: 'negative',
      hidden: bill.status !== 'OPEN' && bill.status !== 'PAID',
      handler: () => update(bill, 'VOID'),
    },
    {
      key: 'correct',
      label: t('action.correct'),
      icon: 'edit',
      separatorBefore: true,
      hidden: bill.status !== 'OPEN',
      handler: () => correct(bill),
    },
    {
      key: 'rebill',
      label: t('action.rebill'),
      icon: 'autorenew',
      color: 'primary',
      hidden: bill.status !== 'VOID' || bill.replacedByBillId !== null,
      handler: () => rebill(bill),
    },
    {
      key: 'note',
      label: t('action.note'),
      icon: 'edit_note',
      separatorBefore: bill.status !== 'DRAFT',
      handler: () => update(bill),
    },
  ];
}

function correct(bill: AdminEventBill) {
  quasar
    .dialog({
      component: EventBillDialog,
      componentProps: {
        mode: 'correct',
        subject: `${to(bill.eventName)} · ${bill.organization.name}`,
        measured: Math.max(
          bill.startRegistrationCount,
          bill.endRegistrationCount ?? 0,
        ),
        adjusted: bill.adjustedRegistrationCount,
        note: bill.note,
      },
    })
    .onOk((result: EventBillDialogResult) => {
      void withProgressNotification('updateBill', () =>
        api.updateBill(bill.id, {
          adjustedRegistrationCount: result.adjustedRegistrationCount,
          note: result.note,
        }),
      ).then(
        () => reload(),
        // Already reported by the progress notification.
        () => undefined,
      );
    });
}

function rebill(bill: AdminEventBill) {
  quasar
    .dialog({
      component: EventBillDialog,
      componentProps: {
        mode: 'rebill',
        subject: `${to(bill.eventName)} · ${bill.organization.name}`,
        measured: Math.max(
          bill.startRegistrationCount,
          bill.endRegistrationCount ?? 0,
        ),
        adjusted: bill.adjustedRegistrationCount,
      },
    })
    .onOk((result: EventBillDialogResult) => {
      void withProgressNotification('createBill', () =>
        api.createBill({
          replacesBillId: bill.id,
          ...(result.priceModelId ? { priceModelId: result.priceModelId } : {}),
          ...(result.adjustedRegistrationCount !== null
            ? { adjustedRegistrationCount: result.adjustedRegistrationCount }
            : {}),
          note: result.note,
        }),
      ).then(
        () => reload(),
        // Already reported by the progress notification.
        () => undefined,
      );
    });
}

/** Every change asks for a note — the bill's only record of why. */
function update(bill: AdminEventBill, newStatus?: 'PAID' | 'VOID') {
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

      void withProgressNotification('updateBill', () =>
        api.updateBill(bill.id, data),
      ).then(
        () => reload(),
        // Already reported by the progress notification.
        () => undefined,
      );
    });
}
</script>

<i18n lang="yaml" locale="en">
title: 'Bills'
search: 'Search by organization'
counts: 'Start {start} · End {end}'
corrected: 'Corrected by an administrator'
replaced: 'Replaced'
replacement: 'Replacement'
status:
  DRAFT: 'Running'
  OPEN: 'Open'
  PAID: 'Paid'
  VOID: 'Void'
column:
  event: 'Event'
  organization: 'Organization'
  registrationCount: 'Registrations'
  grossAmount: 'Total'
  status: 'Status'
  finalizedAt: 'Billed'
  action: 'Actions'
action:
  priceModels: 'Price models'
  paid: 'Mark as paid'
  void: 'Void'
  correct: 'Correct registrations'
  rebill: 'Bill again'
  note: 'Edit note'
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
title: 'Rechnungen'
search: 'Nach Organisation suchen'
counts: 'Beginn {start} · Ende {end}'
corrected: 'Von der Administration korrigiert'
replaced: 'Ersetzt'
replacement: 'Ersatz'
status:
  DRAFT: 'Laufend'
  OPEN: 'Offen'
  PAID: 'Bezahlt'
  VOID: 'Storniert'
column:
  event: 'Veranstaltung'
  organization: 'Organisation'
  registrationCount: 'Anmeldungen'
  grossAmount: 'Gesamt'
  status: 'Status'
  finalizedAt: 'Abgerechnet'
  action: 'Aktionen'
action:
  priceModels: 'Preismodelle'
  paid: 'Als bezahlt markieren'
  void: 'Stornieren'
  correct: 'Anmeldungen korrigieren'
  rebill: 'Neu abrechnen'
  note: 'Notiz bearbeiten'
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
title: 'Factures'
search: 'Rechercher par organisation'
counts: 'Début {start} · Fin {end}'
corrected: 'Corrigé par un administrateur'
replaced: 'Remplacée'
replacement: 'Remplacement'
status:
  DRAFT: 'En cours'
  OPEN: 'Ouverte'
  PAID: 'Payée'
  VOID: 'Annulée'
column:
  event: 'Événement'
  organization: 'Organisation'
  registrationCount: 'Inscriptions'
  grossAmount: 'Total'
  status: 'Statut'
  finalizedAt: 'Facturée'
  action: 'Actions'
action:
  priceModels: 'Modèles tarifaires'
  paid: 'Marquer comme payée'
  void: 'Annuler'
  correct: 'Corriger les inscriptions'
  rebill: 'Facturer à nouveau'
  note: 'Modifier la note'
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
title: 'Rachunki'
search: 'Szukaj po organizacji'
counts: 'Początek {start} · Koniec {end}'
corrected: 'Poprawione przez administratora'
replaced: 'Zastąpiony'
replacement: 'Zastępczy'
status:
  DRAFT: 'W toku'
  OPEN: 'Otwarty'
  PAID: 'Opłacony'
  VOID: 'Anulowany'
column:
  event: 'Wydarzenie'
  organization: 'Organizacja'
  registrationCount: 'Zgłoszenia'
  grossAmount: 'Razem'
  status: 'Status'
  finalizedAt: 'Rozliczono'
  action: 'Akcje'
action:
  priceModels: 'Modele cenowe'
  paid: 'Oznacz jako opłacony'
  void: 'Anuluj'
  correct: 'Popraw liczbę zgłoszeń'
  rebill: 'Rozlicz ponownie'
  note: 'Edytuj notatkę'
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
title: 'Faktury'
search: 'Hledat podle organizace'
counts: 'Začátek {start} · Konec {end}'
corrected: 'Opraveno administrátorem'
replaced: 'Nahrazená'
replacement: 'Náhradní'
status:
  DRAFT: 'Probíhá'
  OPEN: 'Otevřená'
  PAID: 'Zaplacená'
  VOID: 'Stornovaná'
column:
  event: 'Akce'
  organization: 'Organizace'
  registrationCount: 'Přihlášky'
  grossAmount: 'Celkem'
  status: 'Stav'
  finalizedAt: 'Vyúčtováno'
  action: 'Akce'
action:
  priceModels: 'Cenové modely'
  paid: 'Označit jako zaplacenou'
  void: 'Stornovat'
  correct: 'Opravit přihlášky'
  rebill: 'Vyúčtovat znovu'
  note: 'Upravit poznámku'
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
