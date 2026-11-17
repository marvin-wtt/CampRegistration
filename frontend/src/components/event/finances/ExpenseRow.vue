<template>
  <!-- One receipt in the list; payer and file get their own columns when
       wide. Tapping it opens its details, where it is edited or deleted. -->
  <q-item
    clickable
    class="expense-row"
    data-test="expense-item"
    @click="dialogs.expenseDetails(expense)"
  >
    <q-item-section avatar>
      <receipt-badge
        :number="expense.receiptNumber"
        :pending="!expense.date"
      />
    </q-item-section>

    <q-item-section class="expense-main">
      <q-item-label class="row items-center no-wrap q-gutter-x-sm">
        <span class="ellipsis text-weight-medium">
          {{ expense.description }}
        </span>
        <span
          v-if="expense.vendor"
          class="ellipsis text-on-surface-variant"
        >
          {{ expense.vendor }}
        </span>
        <q-badge
          v-if="wide && expense.type === 'REFUND'"
          color="tertiary-container"
          text-color="on-tertiary-container"
          :label="t('finance.type.refund')"
        />
      </q-item-label>
      <q-item-label
        caption
        class="row items-center q-gutter-x-xs no-wrap"
      >
        <span
          v-if="caption"
          class="ellipsis"
        >
          {{ caption }}
        </span>
        <q-badge
          v-if="financeStore.isMissingCategory(expense)"
          color="warning-container"
          text-color="on-warning-container"
          :label="t('finance.noCategory')"
          data-test="expense-no-category"
        />
        <!-- Wide rows show the file in its own column. -->
        <q-badge
          v-if="!wide && missingFile"
          color="warning-container"
          text-color="on-warning-container"
          :label="t('finance.noFile')"
        />
      </q-item-label>
    </q-item-section>

    <template v-if="wide">
      <q-item-section
        side
        class="payer-cell"
      >
        <span
          class="ellipsis"
          :class="
            expense.paidByName
              ? 'text-on-surface'
              : 'text-italic text-on-surface-variant'
          "
        >
          {{ payerName(expense) }}
        </span>
      </q-item-section>

      <q-item-section
        side
        class="file-cell"
      >
        <m-btn
          v-if="expense.files.length > 0"
          icon="attach_file"
          color="primary"
          flat
          round
          dense
          :aria-label="
            expense.files.length === 1
              ? t('finance.action.openFile', { name: expense.files[0]!.name })
              : t('finance.files', expense.files.length)
          "
          data-test="expense-files"
          @click.stop="
            expense.files.length === 1 && openURL(expense.files[0]!.url)
          "
        >
          <q-badge
            v-if="expense.files.length > 1"
            :label="expense.files.length"
            color="primary"
            text-color="on-primary"
            floating
            rounded
          />
          <q-tooltip v-if="expense.files.length === 1">
            {{ expense.files[0]!.name }}
          </q-tooltip>
          <q-menu
            v-if="expense.files.length > 1"
            auto-close
          >
            <q-list dense>
              <q-item
                v-for="file in expense.files"
                :key="file.id"
                clickable
                @click="openURL(file.url)"
              >
                <q-item-section avatar>
                  <q-icon
                    :name="
                      file.type.startsWith('image/') ? 'image' : 'description'
                    "
                  />
                </q-item-section>
                <q-item-section>{{ file.name }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </m-btn>
        <!-- A pending receipt is expected to lack a file: no warning yet. -->
        <q-icon
          v-else
          name="no_photography"
          :color="expense.date ? 'warning' : 'on-surface-variant'"
          size="20px"
          data-test="expense-no-file"
        >
          <q-tooltip>{{ t('finance.noFile') }}</q-tooltip>
        </q-icon>
      </q-item-section>
    </template>

    <q-item-section
      side
      class="amount-cell"
    >
      <q-item-label
        class="text-amount"
        :class="{
          'text-tertiary': expense.type === 'REFUND',
          'text-weight-medium': wide,
        }"
      >
        {{ signedMoney(expense) }}
      </q-item-label>
      <q-item-label
        v-if="wide && expense.originalCurrency"
        caption
      >
        {{ money(expense.originalAmount ?? 0, expense.originalCurrency) }}
      </q-item-label>
      <q-item-label
        v-else-if="!wide && expense.type === 'REFUND'"
        caption
        class="text-tertiary"
      >
        {{ t('finance.type.refund') }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { openURL } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { Expense } from '@camp-registration/common/entities';
import ReceiptBadge from '@/components/event/finances/ReceiptBadge.vue';
import { useFinanceDialogs } from '@/composables/financeDialogs';
import { useFinanceFormat } from '@/composables/financeFormat';
import { useFinanceStore } from '@/stores/finance-store';

const { expense, wide = false } = defineProps<{
  expense: Expense;
  /** Payer and file in columns of their own. */
  wide?: boolean;
}>();

const { t } = useI18n();
const dialogs = useFinanceDialogs();
const financeStore = useFinanceStore();
const { money, signedMoney, categoryName, categoryPath, payerName } =
  useFinanceFormat();

// A receipt still to come is expected to lack its file.
const missingFile = computed(
  () => expense.files.length === 0 && !!expense.date,
);

// Wide: the category with its group. Narrow: category and payer, which has
// no column there.
const caption = computed(() =>
  wide
    ? categoryPath(expense.categoryId)
    : [categoryName(expense.categoryId), payerName(expense)]
        .filter(Boolean)
        .join(' · '),
);
</script>

<style scoped>
.expense-row {
  min-height: 64px;
  padding: 10px 16px;
}

.expense-main {
  min-width: 0;
}

.payer-cell {
  width: 180px;
  min-width: 0;
  align-items: flex-start;
}

.payer-cell > span {
  max-width: 100%;
}

.file-cell {
  width: 48px;
  align-items: center;
}

.amount-cell {
  min-width: 112px;
  /* The list's side slot is muted by default; an amount must stay legible. */
  color: var(--md3-on-surface);
}
</style>
