<template>
  <!-- What a receipt is; changing it goes through Edit. -->
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="expense.description"
      no-form
      closable
      @cancel="onDialogCancel"
    >
      <!-- The receipt number, styled as in the list. -->
      <template #avatar>
        <div
          class="receipt-badge rounded-md column items-center justify-center q-mr-md"
          :class="{ 'receipt-badge--pending': !expense.date }"
        >
          <q-icon
            v-if="!expense.date"
            name="hourglass_empty"
            size="14px"
          />
          #{{ expense.receiptNumber.toString() }}
        </div>
      </template>

      <div class="column no-wrap q-gutter-y-sm">
        <div class="column items-center text-center q-pb-sm">
          <div class="text-h4 amount">{{ signedMoney(expense) }}</div>
          <div class="text-body2 text-on-surface-variant">
            {{
              expense.type === 'REFUND'
                ? t('finance.type.refund')
                : t('finance.type.expense')
            }}
            <template
              v-if="expense.originalAmount !== null && expense.originalCurrency"
            >
              ·
              <span class="amount">
                {{ money(expense.originalAmount, expense.originalCurrency) }}
              </span>
            </template>
          </div>
        </div>

        <q-list>
          <q-item>
            <q-item-section avatar>
              <q-icon
                :name="expense.date ? 'event' : 'hourglass_empty'"
                :color="expense.date ? 'on-surface-variant' : 'warning'"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>
                {{ t('finance.field.receiptDate') }}
              </q-item-label>
              <q-item-label :class="{ 'text-warning': !expense.date }">
                {{
                  expense.date
                    ? d(parseLocalDate(expense.date), 'date')
                    : t('finance.receiptPending')
                }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-icon
                name="person"
                color="on-surface-variant"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>
                {{
                  expense.type === 'REFUND'
                    ? t('finance.field.receivedBy')
                    : t('finance.field.paidBy')
                }}
              </q-item-label>
              <q-item-label>{{ payerName(expense) }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-if="expense.vendor">
            <q-item-section avatar>
              <q-icon
                name="storefront"
                color="on-surface-variant"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>
                {{
                  expense.type === 'REFUND'
                    ? t('finance.field.vendorRefund')
                    : t('finance.field.vendor')
                }}
              </q-item-label>
              <q-item-label>{{ expense.vendor }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-if="category || missingCategory">
            <q-item-section avatar>
              <q-icon
                :name="category ? 'category' : 'label_off'"
                :color="category ? 'on-surface-variant' : 'warning'"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>
                {{ t('finance.field.category') }}
              </q-item-label>
              <q-item-label :class="{ 'text-warning': !category }">
                {{ category || t('finance.noCategory') }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-if="statements">
            <q-item-section avatar>
              <q-icon
                name="request_quote"
                color="on-surface-variant"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>
                {{ t('finance.expenseDetails.statements') }}
              </q-item-label>
              <q-item-label>{{ statements }}</q-item-label>
            </q-item-section>
          </q-item>

          <!-- The receipt files, each opened as stored -->
          <q-item
            v-for="file in expense.files"
            :key="file.id"
            clickable
            :href="file.url"
            target="_blank"
            rel="noopener"
          >
            <q-item-section avatar>
              <q-icon
                :name="
                  file.type === 'application/pdf' ? 'picture_as_pdf' : 'image'
                "
                color="primary"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>
                {{ t('finance.field.receipt') }}
              </q-item-label>
              <q-item-label class="ellipsis text-primary">
                {{ file.name }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon
                name="open_in_new"
                size="20px"
              />
            </q-item-section>
          </q-item>
          <!-- A receipt still to come is expected to lack its file. -->
          <q-item v-if="expense.files.length === 0">
            <q-item-section avatar>
              <q-icon
                name="no_photography"
                :color="expense.date ? 'warning' : 'on-surface-variant'"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>
                {{ t('finance.field.receipt') }}
              </q-item-label>
              <q-item-label :class="{ 'text-warning': expense.date }">
                {{ t('finance.noFile') }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <template
        v-if="canEdit || canDelete"
        #actions
      >
        <!-- Destructive, so apart from the main action; an icon on phones. -->
        <q-btn
          v-if="canDelete"
          :label="quasar.screen.xs ? undefined : t('finance.action.delete')"
          icon="delete"
          flat
          :round="quasar.screen.xs"
          :rounded="!quasar.screen.xs"
          no-caps
          color="negative"
          class="q-mr-auto"
          :aria-label="t('finance.action.delete')"
          data-test="expense-details-delete"
          @click="onDialogOK('delete')"
        >
          <q-tooltip v-if="quasar.screen.xs">
            {{ t('finance.action.delete') }}
          </q-tooltip>
        </q-btn>
        <m-btn
          v-if="canEdit"
          :label="t('finance.expenseDetails.edit')"
          icon="edit"
          color="primary"
          data-test="expense-details-edit"
          @click="edit"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { Expense } from '@camp-registration/common/entities';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import { useFinanceFormat } from '@/composables/financeFormat';
import { statementLabels } from '@/composables/payoutStatements';
import { useFinanceStore } from '@/stores/finance-store';
import { parseLocalDate } from '@/utils/date';

const {
  expense,
  canEdit = false,
  canDelete = false,
} = defineProps<{
  expense: Expense;
  canEdit?: boolean;
  canDelete?: boolean;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const quasar = useQuasar();
const { t, d } = useI18n();
const { money, signedMoney, categoryName, categoryGroupName, payerName } =
  useFinanceFormat();
const { payouts, display } = storeToRefs(useFinanceStore());

const category = computed<string>(() =>
  [categoryGroupName(expense.categoryId), categoryName(expense.categoryId)]
    .filter(Boolean)
    .join(' · '),
);

const missingCategory = computed(
  () => display.value.flagMissingCategories && !expense.categoryId,
);

// The payout statements this receipt is on, by label.
const statements = computed(() =>
  statementLabels(expense.id, payouts.value, { includeOutdated: true }),
);

// The dialog closes with what the caller does next: 'edit' or 'delete'.
function edit() {
  onDialogOK('edit');
}
</script>

<style scoped>
.receipt-badge {
  flex: none;
  width: 44px;
  height: 44px;
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: 13px;
  font-weight: 500;
}

.receipt-badge--pending {
  background: var(--md3-warning-container);
  color: var(--md3-on-warning-container);
}

.amount {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
