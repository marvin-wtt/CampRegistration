<template>
  <!-- The frozen statement, shown as it will be printed. -->
  <div class="column no-wrap q-gutter-y-md">
    <div class="statement rounded-lg">
      <div class="text-subtitle2 text-on-surface-variant q-px-md q-pt-md">
        {{ t('finance.statement.expenses', { name: payout.recipientName }) }}
      </div>
      <q-list dense>
        <q-item
          v-for="line in shownExpenses"
          :key="line.number"
        >
          <q-item-section
            avatar
            class="number"
          >
            <span class="receipt-mono text-on-surface-variant">
              {{ line.number }}
            </span>
          </q-item-section>
          <q-item-section>
            <q-item-label class="ellipsis">{{ line.description }}</q-item-label>
            <q-item-label caption>{{ line.date }}</q-item-label>
          </q-item-section>
          <q-item-section
            side
            class="amount text-on-surface"
          >
            {{ line.amount }}
          </q-item-section>
        </q-item>
        <q-item
          v-if="hiddenCount > 0"
          clickable
          class="text-primary"
          data-test="statement-show-all"
          @click="expanded = true"
        >
          <q-item-section
            avatar
            class="number"
          >
            <q-icon name="expand_more" />
          </q-item-section>
          <q-item-section>
            {{
              t('finance.statement.showAll', {
                count: statement.expenses.length,
              })
            }}
          </q-item-section>
        </q-item>
        <q-item v-if="statement.expenses.length === 0">
          <q-item-section class="text-on-surface-variant">
            {{ t('finance.statement.noExpenses') }}
          </q-item-section>
        </q-item>
      </q-list>

      <q-separator class="q-mx-md" />

      <dl class="totals q-px-md q-pt-sm q-pb-md">
        <template
          v-for="line in statement.totals"
          :key="line.label"
        >
          <dt :class="{ 'text-weight-medium text-on-surface': line.strong }">
            {{ line.label }}
          </dt>
          <dd :class="{ 'text-weight-medium': line.strong }">
            {{ line.amount }}
          </dd>
        </template>
        <dt class="text-caption">{{ statement.balanceAfter.label }}</dt>
        <dd class="text-caption text-on-surface-variant">
          {{ statement.balanceAfter.amount }}
        </dd>
      </dl>
    </div>

    <p
      v-if="declaration"
      class="declaration text-body2 q-mb-none"
    >
      {{ statement.declaration }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Payout } from '@camp-registration/common/entities';

const {
  payout,
  declaration = true,
  preview = undefined,
} = defineProps<{
  payout: Payout;
  /** What the recipient confirms; only where they sign. */
  declaration?: boolean;
  /** Receipts listed before "show all"; all of them when unset. */
  preview?: number | undefined;
}>();

const { t } = useI18n();

const statement = computed(() => payout.statement);

const expanded = ref(false);
// One more line costs no more than the button that would replace it.
const limit = computed(() =>
  expanded.value ||
  preview === undefined ||
  statement.value.expenses.length <= preview + 1
    ? Infinity
    : preview,
);
const shownExpenses = computed(() =>
  statement.value.expenses.slice(0, limit.value),
);
const hiddenCount = computed(
  () => statement.value.expenses.length - shownExpenses.value.length,
);
</script>

<style scoped>
.statement {
  border: 1px solid var(--md3-outline-variant);
}

.number {
  min-width: 40px;
}

.receipt-mono {
  font-family: 'Roboto Mono', ui-monospace, monospace;
}

.amount,
.totals dd {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.totals {
  display: grid;
  grid-template-columns: 1fr auto;
  row-gap: 4px;
  margin: 0;
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
