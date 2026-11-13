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
        <q-btn-toggle
          v-model="direction"
          :options="directionOptions"
          spread
          rounded
          unelevated
          no-caps
          toggle-color="secondary-container"
          toggle-text-color="on-secondary-container"
          class="direction-toggle"
        />

        <party-select
          v-model="recipient"
          :parties
          :allow-funds="false"
          :label="t('finance.field.recipient')"
        />

        <div class="column q-gutter-y-xs">
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

        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-6">
            <chore-date-input
              v-model="paidOn"
              :label="t('finance.field.paidOn')"
              :hint="paidOn ? undefined : t('finance.payout.toPayHint')"
              clearable
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model="note"
              :label="t('finance.field.note')"
              maxlength="255"
              outlined
              rounded
              hide-bottom-space
            />
          </div>
        </div>

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
        <!-- An icon on phones, so the actions keep to one row. -->
        <q-btn
          v-if="payout && can('event.payouts.delete')"
          :label="quasar.screen.xs ? undefined : t('finance.action.undoPayout')"
          icon="delete"
          flat
          :round="quasar.screen.xs"
          :rounded="!quasar.screen.xs"
          no-caps
          color="negative"
          class="q-mr-auto"
          :aria-label="t('finance.action.undoPayout')"
          @click="remove"
        >
          <q-tooltip v-if="quasar.screen.xs">
            {{ t('finance.action.undoPayout') }}
          </q-tooltip>
        </q-btn>
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
import { storeToRefs } from 'pinia';
import { useDialogPluginComponent, useQuasar } from 'quasar';
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
import PartySelect, {
  type PartyValue,
} from '@/components/event/finances/PartySelect.vue';
import ChoreDateInput from '@/components/event/chorePlanner/ChoreDateInput.vue';
import { useFinanceStore } from '@/stores/finance-store';
import { useFinanceFormat } from '@/composables/financeFormat';
import { usePermissions } from '@/composables/permissions';
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

const quasar = useQuasar();
const { t } = useI18n();
const { can } = usePermissions();
const financeStore = useFinanceStore();
const { parties } = storeToRefs(financeStore);
const { currency, money } = useFinanceFormat();

const direction = ref<PayoutDirection>(
  props.payout?.direction ?? props.direction ?? 'OUT',
);
const recipient = ref<PartyValue>(
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
const saving = ref(false);

const directionOptions = computed(() => [
  { value: 'OUT', label: t('finance.payout.out'), icon: 'north_east' },
  { value: 'IN', label: t('finance.payout.in'), icon: 'south_west' },
]);

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

  saving.value = true;
  try {
    const result = props.payout
      ? await financeStore.updatePayout(props.payout.id, data)
      : await financeStore.createPayout(data);
    onDialogOK(result);
  } catch {
    // Reported by the store.
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!props.payout) {
    return;
  }
  try {
    await financeStore.deletePayout(props.payout.id);
    onDialogOK();
  } catch {
    // Reported by the store.
  }
}
</script>

<style scoped>
.direction-toggle :deep(.q-btn) {
  min-height: 44px;
}

.after-row {
  background: var(--md3-surface-container-high);
}

.after-row--settled {
  background: var(--md3-positive-container);
  color: var(--md3-on-positive-container);
}
</style>
