<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title
      :subtitle="
        balance
          ? t('finance.payout.openBalance', { amount: money(balance.open) })
          : payout?.label
      "
      :icon="direction === 'OUT' ? 'payments' : 'savings'"
      @submit="submit"
      @cancel="onDialogCancel"
    >
      <div class="column no-wrap q-gutter-y-md">
        <!-- Frozen in the statement: shown, never edited. -->
        <div
          v-if="payout"
          class="frozen rounded-md q-pa-md column q-gutter-y-xs"
        >
          <div class="row items-center justify-between no-wrap">
            <span class="text-body1">
              {{ payout.recipientName }} ·
              {{
                payout.direction === 'OUT'
                  ? t('finance.payout.out')
                  : t('finance.payout.in')
              }}
            </span>
            <strong class="text-amount">
              {{ payout.direction === 'OUT' ? '−' : '+'
              }}{{ money(payout.amount) }}
            </strong>
          </div>
          <div class="text-caption text-on-surface-variant">
            {{ t('finance.payout.frozenHint') }}
          </div>
        </div>

        <div
          v-if="!payout"
          class="column q-gutter-y-xs"
        >
          <amount-input
            v-model="amount"
            :currency
            :label="t('finance.field.amount')"
            autofocus
            large
            data-test="payout-amount"
          />
          <div
            v-if="balance"
            class="text-caption text-on-surface-variant q-px-sm"
          >
            {{ t('finance.payout.prefillHint') }}
          </div>
        </div>

        <q-input
          v-model="note"
          :label="t('finance.field.note')"
          maxlength="255"
          autogrow
          outlined
          rounded
          hide-bottom-space
          data-test="payout-note"
        />
        <!-- Money has moved or it hasn't: never a date ahead. -->
        <date-input
          v-model="paidOn"
          :label="t('finance.field.paidOn')"
          :hint="paidOn ? undefined : t('finance.payout.toPayHint')"
          :max="today"
          open-on-today
          clearable
          data-test="payout-paid-on"
        />

        <div
          v-if="after !== null"
          class="after-row rounded-md row items-center justify-between q-pa-md"
          :class="after === 0 ? 'after-row--settled' : ''"
        >
          <span>{{ t('finance.payout.balanceAfter') }}</span>
          <strong>
            {{ money(after) }}
            <template v-if="after === 0"
              >· {{ t('finance.balance.settled') }}</template
            >
          </strong>
        </div>
      </div>

      <template #actions>
        <m-btn
          :label="t('finance.action.cancel')"
          text
          @click="onDialogCancel"
        />
        <m-btn
          :label="submitLabel"
          :loading="saving"
          color="primary"
          type="submit"
          data-test="payout-submit"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type {
  FinanceBalance,
  Payout,
  PayoutDirection,
} from '@camp-registration/common/entities';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import AmountInput from '@/components/event/finances/AmountInput.vue';
import DateInput from '@/components/common/inputs/DateInput.vue';
import { useFinanceStore } from '@/stores/finance-store';
import { useFinanceFormat } from '@/composables/financeFormat';
import { formatLocalDate } from '@/utils/date';

const props = defineProps<{
  /** Pays out or receives against this balance. */
  balance?: FinanceBalance | undefined;
  direction?: PayoutDirection | undefined;
  /** Edits this payout instead. */
  payout?: Payout | undefined;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const { t } = useI18n();
const financeStore = useFinanceStore();
const { currency, money } = useFinanceFormat();

// Chosen by the balance card's button (pay out or receive): never switched here.
const direction = computed<PayoutDirection>(
  () => props.payout?.direction ?? props.direction ?? 'OUT',
);
// The card's person, like the direction: the balance after is theirs.
const recipient = computed(() =>
  props.payout
    ? {
        userId: props.payout.recipientUserId,
        name: props.payout.recipientName,
      }
    : {
        userId: props.balance?.userId ?? null,
        name: props.balance?.name ?? null,
      },
);
// Settling prefills what is open, net of payouts already agreed.
const amount = ref<number | null>(
  props.payout?.amount ??
    (props.balance && Math.abs(props.balance.open) > 0
      ? Math.abs(props.balance.open)
      : null),
);
// A payout is usually agreed and signed first and transferred later; money
// handed back is there right away.
const paidOn = ref<string | null>(
  props.payout
    ? props.payout.paidOn
    : props.direction === 'IN'
      ? formatLocalDate(new Date())
      : null,
);
const note = ref<string>(props.payout?.note ?? '');
const today = formatLocalDate(new Date());
const saving = ref(false);

const title = computed(() => {
  const name = recipient.value.name ?? '';
  if (props.payout) {
    return t('finance.payout.editTitle');
  }
  return direction.value === 'OUT'
    ? t('finance.payout.outTitle', { name })
    : t('finance.payout.inTitle', { name });
});

const submitLabel = computed(() =>
  props.payout
    ? t('finance.action.save')
    : direction.value === 'OUT'
      ? t('finance.action.payOut')
      : t('finance.action.receive'),
);

const after = computed<number | null>(() => {
  if (!props.balance || amount.value === null) {
    return null;
  }
  return direction.value === 'OUT'
    ? props.balance.open - amount.value
    : props.balance.open + amount.value;
});

async function submit() {
  const existing = props.payout;
  if (existing) {
    await save(() =>
      financeStore.updatePayout(existing.id, {
        paidOn: paidOn.value,
        note: note.value.trim() || null,
      }),
    );
    return;
  }
  if (amount.value === null) {
    return;
  }

  const data = {
    recipientUserId: recipient.value.userId,
    recipientName: recipient.value.userId ? null : recipient.value.name,
    direction: direction.value,
    amount: amount.value,
    paidOn: paidOn.value,
    note: note.value.trim() || null,
  };

  await save(() => financeStore.createPayout(data));
}

async function save(write: () => Promise<Payout>) {
  saving.value = true;
  try {
    onDialogOK(await write());
  } catch {
    // Reported by the store.
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.frozen {
  background: var(--md3-surface-container-high);
}

.after-row {
  background: var(--md3-surface-container-high);
}

.after-row--settled {
  background: var(--md3-positive-container);
  color: var(--md3-on-positive-container);
}
</style>
