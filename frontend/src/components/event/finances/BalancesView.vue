<template>
  <div class="column no-wrap balances-view">
    <!-- What is left to do, by the same rule as each card's status. -->
    <div
      v-if="viewsAll && balances.length > 0"
      class="totals-strip rounded-xl column q-px-lg q-py-md"
      :class="{ 'totals-strip--owed': toComeBack > 0 }"
      data-test="balance-totals"
    >
      <div class="figures row items-end">
        <div class="column">
          <span class="text-caption text-on-surface-variant">
            {{ t('finance.balance.stillOpen') }}
          </span>
          <span class="text-h5 amount">{{ money(stillOpen) }}</span>
        </div>
        <div class="column">
          <span class="text-caption text-on-surface-variant">
            {{ t('finance.balance.agreedUnpaid') }}
          </span>
          <span class="text-h6 amount">{{ money(agreedUnpaid) }}</span>
        </div>
        <div
          v-if="toComeBack > 0"
          class="column"
        >
          <span class="text-caption text-on-surface-variant">
            {{ t('finance.balance.toComeBack') }}
          </span>
          <span class="text-h6 amount text-warning">
            {{ money(toComeBack) }}
          </span>
        </div>
      </div>
      <div class="row items-center no-wrap q-gutter-x-md q-mt-sm">
        <q-linear-progress
          :value="balances.length ? settled / balances.length : 0"
          color="primary"
          track-color="surface-container-highest"
          rounded
          size="6px"
          class="col"
        />
        <span class="text-caption text-on-surface-variant no-wrap">
          {{
            t('finance.balance.settledProgress', {
              settled,
              total: balances.length,
            })
          }}
        </span>
      </div>
    </div>

    <div
      v-if="balances.length === 0"
      class="column items-center q-py-xl text-center"
    >
      <q-icon
        name="account_balance_wallet"
        size="56px"
        class="text-on-surface-variant"
      />
      <div class="text-h6 q-mt-md">{{ t('finance.balance.emptyTitle') }}</div>
      <div class="text-body2 text-on-surface-variant q-mt-xs">
        {{ t('finance.balance.emptyMessage') }}
      </div>
    </div>

    <div
      v-else
      class="balance-grid"
    >
      <q-card
        v-for="balance in balances"
        :key="balance.userId ?? balance.name"
        flat
        bordered
        class="rounded-xl column no-wrap"
        data-test="balance-card"
      >
        <q-card-section class="row items-center no-wrap q-gutter-x-md">
          <q-avatar
            color="primary-container"
            text-color="on-primary-container"
            :icon="balance.userId ? undefined : 'badge'"
          >
            <template v-if="balance.userId">
              {{ initial(balance.name) }}
            </template>
          </q-avatar>
          <div class="col">
            <div class="text-subtitle1 text-weight-medium ellipsis">
              {{ balance.name }}
            </div>
            <div class="text-caption text-on-surface-variant">
              {{
                balance.userId
                  ? t('finance.balance.manager')
                  : t('finance.balance.other')
              }}
            </div>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="text-h4 amount">{{ money(balance.balance) }}</div>
          <q-badge
            v-bind="status(balance)"
            class="q-mt-xs status-badge"
          />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <dl class="breakdown">
            <dt>{{ t('finance.balance.paid') }}</dt>
            <dd>{{ money(balance.paid) }}</dd>
            <!-- Refunds and money handed back are rare: shown when there are any. -->
            <template v-if="balance.refunds > 0">
              <dt>{{ t('finance.balance.refunds') }}</dt>
              <dd>{{ money(balance.refunds) }}</dd>
            </template>
            <dt>{{ t('finance.balance.paidOut') }}</dt>
            <dd>{{ money(balance.paidOut) }}</dd>
            <template v-if="balance.paidBack > 0">
              <dt>{{ t('finance.balance.paidBack') }}</dt>
              <dd>{{ money(balance.paidBack) }}</dd>
            </template>
            <template v-if="balance.toPay > 0">
              <dt class="text-tertiary">{{ t('finance.balance.toPay') }}</dt>
              <dd class="text-tertiary">{{ money(balance.toPay) }}</dd>
            </template>
            <template v-if="balance.toReceive > 0">
              <dt class="text-tertiary">
                {{ t('finance.balance.toReceive') }}
              </dt>
              <dd class="text-tertiary">{{ money(balance.toReceive) }}</dd>
            </template>
          </dl>
        </q-card-section>

        <q-separator inset />

        <q-card-section class="col">
          <div class="text-overline text-on-surface-variant">
            {{ t('finance.balance.payouts') }}
          </div>
          <div
            v-if="payoutsOf(balance).length === 0"
            class="text-body2 text-on-surface-variant"
          >
            {{ t('finance.balance.noPayouts') }}
          </div>
          <q-list dense>
            <q-item
              v-for="payout in payoutsOf(balance)"
              :id="`payout-${payout.id}`"
              :key="payout.id"
              clickable
              class="q-px-none rounded-sm"
              :class="{ 'payout-linked': linkedPayoutId === payout.id }"
              data-test="payout-item"
              @click="openDetails(payout)"
            >
              <q-item-section>
                <!-- Status as icons: a date would not fit the narrow card. -->
                <q-item-label class="payout-line text-body2">
                  <span class="receipt-mono">{{ payout.label }}</span>
                  <q-icon
                    v-if="isSigned(payout)"
                    name="history_edu"
                    color="primary"
                    size="16px"
                  >
                    <q-tooltip>{{ t('finance.statement.signed') }}</q-tooltip>
                  </q-icon>
                  <q-icon
                    :name="payout.paidOn ? 'payments' : 'schedule'"
                    :color="payout.paidOn ? 'positive' : 'tertiary'"
                    size="16px"
                  >
                    <q-tooltip>
                      {{
                        payout.paidOn
                          ? t('finance.payout.details.paidOn', {
                              date: d(parseLocalDate(payout.paidOn), 'date'),
                            })
                          : t('finance.payout.details.toPay')
                      }}
                    </q-tooltip>
                  </q-icon>
                  <q-icon
                    v-if="payout.outdated"
                    name="error"
                    color="negative"
                    size="16px"
                    data-test="payout-outdated"
                  >
                    <q-tooltip max-width="280px">
                      {{
                        payout.paidOn
                          ? t('finance.statement.correctedLaterHint')
                          : t('finance.statement.outdatedHint')
                      }}
                    </q-tooltip>
                  </q-icon>
                </q-item-label>
                <q-item-label
                  v-if="payout.note"
                  caption
                  class="ellipsis"
                >
                  {{ payout.note }}
                </q-item-label>
              </q-item-section>
              <q-item-section
                side
                class="amount"
              >
                {{ payout.direction === 'OUT' ? '−' : '+'
                }}{{ money(payout.amount) }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions
          v-if="can('event.payouts.create')"
          class="q-pa-md q-gutter-sm"
        >
          <m-btn
            :label="t('finance.action.payOut')"
            :color="balance.open > 0 ? 'primary' : undefined"
            :tonal="balance.open <= 0"
            class="col"
            data-test="balance-pay-out"
            @click="dialogs.payout(balance, 'OUT', openDetails)"
          />
          <m-btn
            :label="t('finance.action.receive')"
            :color="balance.open < 0 ? 'primary' : undefined"
            :tonal="balance.open >= 0"
            class="col"
            @click="dialogs.payout(balance, 'IN', openDetails)"
          />
        </q-card-actions>
      </q-card>
    </div>

    <p class="text-caption text-on-surface-variant q-mb-none">
      {{
        viewsAll ? t('finance.balance.formula') : t('finance.balance.ownOnly')
      }}
    </p>
    <input
      ref="scanInput"
      type="file"
      accept="image/*,application/pdf"
      class="hidden"
      data-test="payout-scan-input"
      @change="onScanPicked"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { copyToClipboard, useQuasar } from 'quasar';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type {
  FinanceBalance,
  Payout,
} from '@camp-registration/common/entities';
import { partyKey, recipientKey } from '@camp-registration/common/utils';
import { useFinanceFormat } from '@/composables/financeFormat';
import { useFinanceDialogs } from '@/composables/financeDialogs';
import { usePermissions } from '@/composables/permissions';
import PayoutDetailsDialog from '@/components/event/finances/dialogs/PayoutDetailsDialog.vue';
import type { PayoutActions } from '@/components/event/finances/dialogs/PayoutDetailsDialog.vue';
import { usePayoutSlip } from '@/composables/payoutSlip';
import { useFinanceStore } from '@/stores/finance-store';
import { formatLocalDate, parseLocalDate } from '@/utils/date';

const { balances, payouts } = defineProps<{
  balances: readonly FinanceBalance[];
  payouts: readonly Payout[];
}>();

const { t, d } = useI18n();
const { can, canOn } = usePermissions();
const { money } = useFinanceFormat();
const dialogs = useFinanceDialogs();
const financeStore = useFinanceStore();
const route = useRoute();
const router = useRouter();
const quasar = useQuasar();
const viewsAll = computed(() => can('event.expenses.view'));

// --- Links: `?tab=balances&payout=<id>` opens a payout, e.g. to sign it ----

const linkedPayoutId = ref<string | null>(null);

function payoutLink(payout: Payout): string {
  const { href } = router.resolve({
    name: 'management.event.finances',
    params: route.params,
    query: { tab: 'balances', payout: payout.id },
  });
  return window.location.origin + href;
}

async function copyPayoutLink(payout: Payout) {
  try {
    await copyToClipboard(payoutLink(payout));
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

function openLinkedPayout(id: string) {
  const payout = payouts.find((p) => p.id === id);
  if (!payout) {
    quasar.notify({ type: 'warning', message: t('finance.payout.notFound') });
    return;
  }

  linkedPayoutId.value = id;
  document
    .getElementById(`payout-${id}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (canSign(payout) && !isSigned(payout) && !payout.outdated) {
    dialogs.signPayout(payout);
  }
}

// Payouts and parties load beside the expenses this view waits for, so the
// link is handled once both are in. The parameter is consumed, so a reload
// doesn't reopen the dialog.
onMounted(() => {
  const id = route.query.payout;
  if (typeof id !== 'string') {
    return;
  }
  void router.replace({ query: { ...route.query, payout: undefined } });
  let handled = false;
  watch(
    () =>
      financeStore.payouts !== undefined && financeStore.parties !== undefined,
    async (ready) => {
      if (!ready || handled) {
        return;
      }
      handled = true;
      await nextTick();
      openLinkedPayout(id);
    },
    { immediate: true },
  );
});

// Nothing arranged yet: a payout is still to be made.
const stillOpen = computed(() =>
  balances.reduce((sum, b) => sum + Math.max(b.open, 0), 0),
);
// Arranged, but the money hasn't moved yet.
const agreedUnpaid = computed(() =>
  balances.reduce((sum, b) => sum + b.toPay, 0),
);
// Rare: only shown while someone owes the event.
const toComeBack = computed(() =>
  balances.reduce((sum, b) => sum + Math.max(-b.balance, 0), 0),
);
const settled = computed(() => balances.filter((b) => b.balance === 0).length);

const printSlip = usePayoutSlip();

/** Tapping a payout shows what it is and offers its actions: the only menu. */
function openDetails(payout: Payout) {
  quasar.dialog({
    component: PayoutDetailsDialog,
    componentProps: {
      payout,
      actionsFor: payoutActions,
    },
  });
}

/** On screen, or as a scan of the slip signed on paper. */
function isSigned(payout: Payout): boolean {
  return payout.signedAt !== null || payout.files.length > 0;
}

// One hidden picker for every payout: the camera or a PDF on phones.
const scanInput = ref<HTMLInputElement | null>(null);
const scanTarget = ref<Payout | null>(null);

function pickScan(payout: Payout) {
  scanTarget.value = payout;
  scanInput.value?.click();
}

function onScanPicked(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file && scanTarget.value) {
    financeStore
      .attachPayoutScan(scanTarget.value, file)
      .catch(() => undefined);
  }
}

function canSign(payout: Payout): boolean {
  return canOn('event.payouts.sign', payout);
}

/** The transfer is made: today, editable afterwards like any date. */
function markPaid(payout: Payout) {
  setPaidOn(payout, formatLocalDate(new Date()));
}

function setPaidOn(payout: Payout, paidOn: string | null) {
  financeStore.updatePayout(payout.id, { paidOn }).catch(() => undefined);
}

function payoutActions(payout: Payout): PayoutActions {
  const editable = can('event.payouts.edit');
  // One way at a time: a signature is removed before signing anew.
  const signable = !isSigned(payout) && !payout.outdated;
  return {
    sign:
      signable && canSign(payout)
        ? {
            label: t('finance.statement.sign'),
            icon: 'draw',
            onClick: () => dialogs.signPayout(payout),
          }
        : undefined,
    // A scan may take further pages.
    uploadScan:
      editable && payout.signedAt === null && !payout.outdated
        ? {
            label: t('finance.statement.uploadScan'),
            icon: 'document_scanner',
            onClick: () => pickScan(payout),
          }
        : undefined,
    scans: payout.files.map((file, index) => ({
      label:
        payout.files.length > 1
          ? `${t('finance.statement.openScan')} ${(index + 1).toString()}`
          : t('finance.statement.openScan'),
      icon: 'description',
      onClick: () => window.open(file.url, '_blank', 'noopener'),
    })),
    unsign:
      isSigned(payout) && editable
        ? {
            label: t('finance.statement.unsign.action'),
            icon: 'edit_off',
            onClick: () => dialogs.unsignPayout(payout),
          }
        : undefined,
    markPaid:
      !payout.paidOn && editable
        ? {
            label: t('finance.payout.markPaid'),
            icon: 'task_alt',
            onClick: () => markPaid(payout),
          }
        : undefined,
    markUnpaid:
      payout.paidOn && editable
        ? {
            label: t('finance.payout.markUnpaid'),
            icon: 'undo',
            onClick: () => setPaidOn(payout, null),
          }
        : undefined,
    print: {
      label: t('finance.action.printSlip'),
      icon: 'print',
      onClick: () => printSlip(payout),
    },
    copyLink: {
      label: t('finance.payout.copyLink'),
      icon: 'link',
      onClick: () => void copyPayoutLink(payout),
    },
    edit: editable
      ? {
          label: t('finance.payout.editTitle'),
          icon: 'edit',
          onClick: () => dialogs.editPayout(payout),
        }
      : undefined,
    remove: can('event.payouts.delete')
      ? {
          label: t('finance.action.undoPayout'),
          icon: 'delete',
          onClick: () => dialogs.removePayout(payout),
        }
      : undefined,
  };
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

function payoutsOf(balance: FinanceBalance): Payout[] {
  const key = partyKey(balance.userId, balance.name);
  return payouts.filter((p) => recipientKey(p) === key);
}

// By what is left to arrange: an agreed payout no longer reads as owed.
function status(balance: FinanceBalance) {
  const first = balance.name.split(' ')[0] ?? balance.name;
  if (balance.open > 0) {
    return {
      color: 'primary-container',
      textColor: 'on-primary-container',
      label: t('finance.balance.eventOwes', { name: first }),
    };
  }
  if (balance.open < 0) {
    return {
      color: 'warning-container',
      textColor: 'on-warning-container',
      label: t('finance.balance.owesEvent', { name: first }),
    };
  }
  if (balance.balance !== 0) {
    return {
      color: 'tertiary-container',
      textColor: 'on-tertiary-container',
      label: t('finance.balance.pending'),
    };
  }
  return {
    color: 'positive-container',
    textColor: 'on-positive-container',
    label: t('finance.balance.settled'),
  };
}
</script>

<style scoped>
.balances-view {
  gap: 24px;
}

.balance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.totals-strip {
  background: var(--md3-surface-container);
}

.totals-strip--owed {
  box-shadow: inset 0 0 0 1px var(--md3-warning);
}

.figures {
  gap: 8px 32px;
}

.amount {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* Label, signed mark and date stay on one line. */
.payout-line {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.payout-linked {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.status-badge {
  padding: 4px 10px;
}

.breakdown {
  display: grid;
  grid-template-columns: 1fr auto;
  row-gap: 4px;
  margin: 0;
}

.breakdown dt {
  color: var(--md3-on-surface-variant);
}

.breakdown dd {
  margin: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.receipt-mono {
  font-family: 'Roboto Mono', ui-monospace, monospace;
}
</style>
