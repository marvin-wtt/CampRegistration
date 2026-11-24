<template>
  <!-- One income, laid out like an expense row: number, what, from whom,
       file, amount. Tapping it opens its details. -->
  <q-item
    clickable
    class="income-row"
    data-test="income-item"
    @click="emit('open', income)"
  >
    <q-item-section avatar>
      <receipt-badge
        :label="income.label"
        :pending="!income.receivedOn"
        :pending-label="t('promised')"
      />
    </q-item-section>

    <q-item-section class="income-main">
      <q-item-label class="row items-center no-wrap q-gutter-x-sm">
        <span class="ellipsis text-weight-medium">
          {{ income.description }}
        </span>
        <span
          v-if="!wide && income.payerName"
          class="ellipsis text-on-surface-variant"
        >
          {{ income.payerName }}
        </span>
      </q-item-label>
      <q-item-label
        caption
        class="ellipsis"
      >
        {{ caption }}
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
            income.payerName
              ? 'text-on-surface'
              : 'text-italic text-on-surface-variant'
          "
        >
          {{ income.payerName ?? t('noPayer') }}
        </span>
      </q-item-section>

      <q-item-section
        side
        class="file-cell"
      >
        <m-btn
          v-if="income.files.length > 0"
          icon="attach_file"
          color="primary"
          flat
          round
          dense
          :aria-label="income.files[0]!.name"
          data-test="income-files"
          @click.stop="openURL(income.files[0]!.url)"
        >
          <q-badge
            v-if="income.files.length > 1"
            :label="income.files.length"
            color="primary"
            text-color="on-primary"
            floating
            rounded
          />
          <q-tooltip>{{ income.files[0]!.name }}</q-tooltip>
        </m-btn>
      </q-item-section>
    </template>

    <q-item-section
      side
      class="amount-cell"
    >
      <q-item-label
        class="text-amount"
        :class="{
          'text-on-surface-variant': !income.receivedOn,
          'text-weight-medium': wide,
        }"
      >
        {{ money(income.amount) }}
      </q-item-label>
      <q-item-label
        v-if="wide && income.originalCurrency"
        caption
      >
        {{ money(income.originalAmount ?? 0, income.originalCurrency) }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { openURL } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { Income } from '@camp-registration/common/entities';
import ReceiptBadge from '@/components/event/finances/ReceiptBadge.vue';
import { useFinanceFormat } from '@/composables/financeFormat';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useFinanceStore } from '@/stores/finance-store';
import { parseLocalDate } from '@/utils/date';

const { income, wide = false } = defineProps<{
  income: Income;
  /** Payer and file in columns of their own. */
  wide?: boolean;
}>();

const emit = defineEmits<{ open: [income: Income] }>();

const { t, d } = useI18n();
const { to } = useObjectTranslation();
const { money } = useFinanceFormat();
const { incomeCategoriesById } = storeToRefs(useFinanceStore());

// When it arrived (or that it is promised) and its category.
const caption = computed(() => {
  const category = income.categoryId
    ? incomeCategoriesById.value.get(income.categoryId)
    : undefined;
  const when = income.receivedOn
    ? d(parseLocalDate(income.receivedOn), 'date')
    : t('promised');

  return [when, category && to(category.name)].filter(Boolean).join(' · ');
});
</script>

<style scoped>
.income-row {
  min-height: 64px;
  padding: 10px 16px;
}

.income-main {
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

<i18n lang="yaml" locale="en">
promised: 'Promised'
noPayer: 'Not named'
</i18n>

<i18n lang="yaml" locale="de">
promised: 'Zugesagt'
noPayer: 'Nicht angegeben'
</i18n>

<i18n lang="yaml" locale="fr">
promised: 'Promis'
noPayer: 'Non indiqué'
</i18n>

<i18n lang="yaml" locale="pl">
promised: 'Obiecano'
noPayer: 'Nie podano'
</i18n>

<i18n lang="yaml" locale="cs">
promised: 'Přislíbeno'
noPayer: 'Neuvedeno'
</i18n>
