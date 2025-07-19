<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section class="text-h5">
        {{ t('title') }}
      </q-card-section>
      <q-card-section class="column q-gutter-y-sm">
        <q-select
          v-for="category in categories"
          :key="category"
          v-model="categoryMappings[category]"
          :label="category"
          :options="config.categories"
          clearable
          outlined
          rounded
        />
      </q-card-section>

      <q-card-actions align="center">
        <q-btn
          :label="t('action.cancel')"
          color="primary"
          rounded
          outline
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('action.export')"
          :loading="isLoading"
          color="primary"
          rounded
          @click="onExport"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import Excel from 'exceljs';
import { useExpensesStore } from 'stores/expense-store.ts';
import { useI18n } from 'vue-i18n';
import { useDialogPluginComponent, exportFile } from 'quasar';
import { computed, onMounted, ref, toRaw } from 'vue';
import type { Expense } from '@camp-registration/common/entities';
import { storeToRefs } from 'pinia';
import { useAPIService } from 'src/services/APIService.ts';
import { receiptListConfigs } from './receiptListConfigs.ts';
import type { ReceiptListFileConfig } from 'components/campManagement/tools/receiptList/ExpenseExportOption';

const { t, locale } = useI18n();
const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } =
  useDialogPluginComponent();
const expensesStore = useExpensesStore();
const { categories, isLoading } = storeToRefs(expensesStore);
const api = useAPIService();

onMounted(() => {
  expensesStore.fetchData();
});

defineEmits([...useDialogPluginComponent.emits]);

const categoryMappings = ref<Record<string, string>>({});
const expenses = ref<Expense[]>(initialData());

const config = computed<ReceiptListFileConfig>(() => {
  const configLocale = locale.value.startsWith('fr') ? 'fr' : 'de';

  return receiptListConfigs[configLocale];
});

function initialData(): Expense[] {
  if (!expensesStore.data) {
    return [];
  }

  const data = structuredClone(toRaw(expensesStore.data));

  return data.toSorted(
    (a, b) => (a.receiptNumber ?? 0) - (b.receiptNumber ?? 0),
  );
}

function onExport() {
  createExpensesReport(config.value);
  onDialogOK();
}

const createExpensesReport = async (config: ReceiptListFileConfig) => {
  const workbook = new Excel.Workbook();

  const buffer = await api.fetchPublicFile('fgyo/' + config.file);
  await workbook.xlsx.load(buffer);

  const ws = workbook.getWorksheet(config.worksheet);

  if (!ws) {
    throw 'Invalid workbook loaded!';
  }

  const writeWithDefault = (
    col: string,
    row: number,
    value: string | number | null,
    fallback: string | number = '',
  ) => {
    ws.getCell(`${col}${row}`).value = value ?? fallback;
  };

  const addRows = (startRow: number, rowCount: number, itemCount: number) => {
    if (rowCount >= itemCount) {
      return;
    }

    // It is not possible to duplicate multiple rows at the same time
    const count = itemCount - rowCount;
    for (let i = 0; i < count; i++) {
      ws.duplicateRow(startRow, 1, true);
    }
  };

  const timestampDate = (timestamp: string | null): string | null => {
    return timestamp?.split('T')[0] ?? null;
  };

  const expenditures = expenses.value.filter((value) => {
    return value.amount > 0;
  });

  const eligibleExpenditures = expenditures.filter((value) => {
    return (
      value.category &&
      Object.values(config.categories).includes(value.category)
    );
  });

  const nonEligibleExpenditures = expenditures.filter((value) => {
    return (
      !value.category ||
      !Object.values(config.categories).includes(value.category)
    );
  });

  const income = expenses.value
    .filter((value) => value.amount < 0)
    .map((value) => ({
      ...value,
      amount: value.amount * -1,
    }));

  const addInformation = (startRow: number) => {
    const totalExpenditures = expenditures.reduce((acc, val) => {
      return acc + val.amount;
    }, 0);
    writeWithDefault('F', startRow, totalExpenditures, 0);

    const totalIncome = income.reduce((acc, val) => {
      return acc + val.amount;
    }, 0);
    writeWithDefault('G', startRow, totalIncome, 0);
  };

  const addIncome = (startRow: number, rowCount: number) => {
    addRows(startRow, rowCount, nonEligibleExpenditures.length);

    income.forEach((value, index) => {
      const row = startRow + index;

      writeWithDefault('A', row, value.name);
      writeWithDefault('B', row, value.receiptNumber);
      writeWithDefault('C', row, timestampDate(value.date));
      writeWithDefault('D', row, value.payee);
      writeWithDefault('E', row, value.category);
      writeWithDefault('G', row, value.amount);
    });
  };

  const addNonEligibleExpenditures = (startRow: number, rowCount: number) => {
    addRows(startRow, rowCount, nonEligibleExpenditures.length);

    nonEligibleExpenditures.forEach((value, index) => {
      const row = startRow + index;

      writeWithDefault('A', row, value.name);
      writeWithDefault('F', row, value.amount);
    });
  };

  const addEligibleExpenditures = (startRow: number, rowCount: number) => {
    addRows(startRow, rowCount, eligibleExpenditures.length);

    eligibleExpenditures.forEach((value, index) => {
      const row = startRow + index;

      writeWithDefault('A', row, value.name);
      writeWithDefault('B', row, value.receiptNumber);
      writeWithDefault('C', row, timestampDate(value.date));
      writeWithDefault('D', row, value.payee);
      writeWithDefault('E', row, value.category);
      writeWithDefault('F', row, value.amount);
    });
  };

  const sections: Record<string, (startRow: number, rowCount: number) => void> =
    {
      eligibleExpenditures: addEligibleExpenditures,
      nonEligibleExpenditures: addNonEligibleExpenditures,
      income: addIncome,
      information: addInformation,
    };

  // Execute in reverse order as new rows are appended at the end of each section
  config.sections
    .filter((value) => value.name in sections)
    .map((value) => ({
      ...value,
      fn: sections[value.name],
    }))
    .sort((a, b) => b.startRow - a.startRow)
    .forEach((value) => {
      value.fn(value.startRow, value.rowCount);
    });

  const data = await workbook.xlsx.writeBuffer();
  exportFile(config.file, data, {
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};
</script>

<style scoped></style>
