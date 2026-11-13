<template>
  <div class="column no-wrap q-gutter-y-md">
    <q-list
      bordered
      separator
      class="rounded-lg"
    >
      <q-item-label header>
        {{ t('finance.statement.expenses', { name: payout.recipientName }) }}
      </q-item-label>
      <q-item
        v-for="expense in statement.expenses"
        :key="expense.id"
        dense
      >
        <q-item-section avatar>
          <span class="receipt-mono text-on-surface-variant">
            #{{ expense.receiptNumber }}
          </span>
        </q-item-section>
        <q-item-section>
          <q-item-label class="ellipsis">{{
            expense.description
          }}</q-item-label>
          <q-item-label caption>
            {{
              expense.date
                ? d(parseLocalDate(expense.date), 'date')
                : t('finance.receiptPending')
            }}
          </q-item-label>
        </q-item-section>
        <q-item-section
          side
          class="amount text-on-surface"
          :class="{ 'text-refund': expense.type === 'REFUND' }"
        >
          {{ signedMoney(expense) }}
        </q-item-section>
      </q-item>
      <q-item
        v-if="statement.expenses.length === 0"
        dense
      >
        <q-item-section class="text-on-surface-variant">
          {{ t('finance.statement.noExpenses') }}
        </q-item-section>
      </q-item>
    </q-list>

    <dl class="totals">
      <dt>{{ t('finance.balance.paid') }}</dt>
      <dd>{{ money(statement.paid) }}</dd>
      <template v-if="statement.refunds > 0">
        <dt>{{ t('finance.balance.refunds') }}</dt>
        <dd>−{{ money(statement.refunds) }}</dd>
      </template>
      <template
        v-for="earlier in statement.earlier"
        :key="earlier.id"
      >
        <dt>
          {{ earlier.label }} ·
          {{
            earlier.paidOn
              ? d(parseLocalDate(earlier.paidOn), 'date')
              : t('finance.payout.toPay')
          }}
        </dt>
        <dd>
          {{ earlier.direction === 'OUT' ? '−' : '+'
          }}{{ money(earlier.amount) }}
        </dd>
      </template>
      <dt class="text-weight-medium">{{ t('finance.statement.open') }}</dt>
      <dd class="text-weight-medium">{{ money(statement.before) }}</dd>
      <dt class="text-weight-medium">
        {{ payout.label }} ·
        {{
          payout.direction === 'OUT'
            ? t('finance.payout.out')
            : t('finance.payout.in')
        }}
      </dt>
      <dd class="text-weight-medium">
        {{ payout.direction === 'OUT' ? '−' : '+' }}{{ money(payout.amount) }}
      </dd>
      <dt>{{ t('finance.payout.balanceAfter') }}</dt>
      <dd>{{ money(statement.after) }}</dd>
    </dl>

    <p class="declaration text-body2 q-mb-none">
      {{ declaration }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Payout } from '@camp-registration/common/entities';
import { useFinanceFormat } from '@/composables/financeFormat';
import { usePayoutDeclaration } from '@/composables/payoutSlip';
import type { PayoutStatement } from '@/utils/payoutStatement';
import { parseLocalDate } from '@/utils/date';

const { payout, statement } = defineProps<{
  payout: Payout;
  statement: PayoutStatement;
}>();

const { t, d } = useI18n();
const { money, signedMoney } = useFinanceFormat();
const declare = usePayoutDeclaration();

const declaration = computed(() => declare(payout));
</script>

<style scoped>
.receipt-mono {
  font-family: 'Roboto Mono', ui-monospace, monospace;
}

.amount,
.totals dd {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.text-refund {
  color: var(--md3-tertiary);
}

.totals {
  display: grid;
  grid-template-columns: 1fr auto;
  row-gap: 4px;
  margin: 0;
  padding: 0 4px;
}

.totals dt {
  color: var(--md3-on-surface-variant);
}

.totals dd {
  margin: 0;
  text-align: right;
}

.declaration {
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--md3-surface-container-high);
  line-height: 1.5;
}
</style>
