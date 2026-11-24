<template>
  <!-- What an income is, like an expense's details. It stays open: editing
       opens on top and returns. -->
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="income.description"
      no-form
      closable
      @cancel="onDialogCancel"
    >
      <template #avatar>
        <receipt-badge
          :label="income.label"
          :pending="!income.receivedOn"
          :pending-label="t('promised')"
          class="q-mr-md"
        />
      </template>
      <template
        v-if="menu.length > 0"
        #header-actions
      >
        <responsive-menu
          :items="menu"
          :label="t('actions')"
          :title="`${income.label} · ${income.description}`"
        />
      </template>

      <div class="column no-wrap q-gutter-y-sm">
        <finance-hero
          :amount="money(income.amount)"
          :caption="caption"
        />

        <q-list>
          <detail-row
            :icon="income.receivedOn ? 'event' : 'hourglass_empty'"
            :label="t('receivedOn')"
            :value="
              income.receivedOn
                ? d(parseLocalDate(income.receivedOn), 'date')
                : t('promised')
            "
            :warn="!income.receivedOn"
          />
          <detail-row
            v-if="income.payerName"
            icon="volunteer_activism"
            :label="t('payer')"
            :value="income.payerName"
          />
          <detail-row
            v-if="category"
            icon="category"
            :label="t('finance.field.category')"
            :value="category"
          />
          <detail-row
            v-for="file in income.files"
            :key="file.id"
            :icon="file.type === 'application/pdf' ? 'picture_as_pdf' : 'image'"
            tone="primary"
            :label="t('document')"
            :value="file.name"
            clickable
            :href="file.url"
            target="_blank"
            rel="noopener"
          >
            <template #side>
              <q-icon
                name="open_in_new"
                size="20px"
              />
            </template>
          </detail-row>
        </q-list>
      </div>

      <template
        v-if="can('event.income.edit')"
        #actions
      >
        <m-btn
          :label="t('edit')"
          icon="edit"
          rounded
          color="primary"
          data-test="income-details-edit"
          @click="edit"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import type { Income } from '@camp-registration/common/entities';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import ConfirmDialog from '@/components/common/dialogs/ConfirmDialog.vue';
import ResponsiveMenu, {
  type ResponsiveMenuItem,
} from '@/components/common/ResponsiveMenu.vue';
import DetailRow from '@/components/event/finances/DetailRow.vue';
import FinanceHero from '@/components/event/finances/FinanceHero.vue';
import ReceiptBadge from '@/components/event/finances/ReceiptBadge.vue';
import IncomeDialog from '@/components/event/finances/dialogs/IncomeDialog.vue';
import { useFinanceFormat } from '@/composables/financeFormat';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { usePermissions } from '@/composables/permissions';
import { useFinanceStore } from '@/stores/finance-store';
import { useIncomeStore } from '@/stores/income-store';
import { parseLocalDate } from '@/utils/date';

const { income: opened } = defineProps<{
  /** As opened; the dialog then follows the store's copy. */
  income: Income;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();

const quasar = useQuasar();
const { t, d } = useI18n();
const { to } = useObjectTranslation();
const { can } = usePermissions();
const { money } = useFinanceFormat();
const incomeStore = useIncomeStore();
const { incomeCategoriesById } = storeToRefs(useFinanceStore());

const current = computed(
  () => incomeStore.incomes?.find((i) => i.id === opened.id) ?? null,
);
const income = computed(() => current.value ?? opened);

// Deleted, here or by someone else: nothing left to show.
watch(current, (found) => {
  if (found === null) {
    onDialogCancel();
  }
});

const caption = computed(() => {
  const { originalAmount, originalCurrency } = income.value;
  return originalAmount !== null && originalCurrency
    ? `${t('kind')} · ${money(originalAmount, originalCurrency)}`
    : t('kind');
});

const category = computed(() => {
  const id = income.value.categoryId;
  const found = id ? incomeCategoriesById.value.get(id) : undefined;
  return found ? to(found.name) : '';
});

function edit() {
  quasar.dialog({
    component: IncomeDialog,
    componentProps: { income: income.value },
  });
}

function remove() {
  quasar
    .dialog({
      component: ConfirmDialog,
      componentProps: {
        title: t('deleteTitle', { label: income.value.label }),
        message: t('deleteMessage'),
        okLabel: t('finance.action.delete'),
        color: 'negative',
      },
    })
    .onOk(() => {
      incomeStore.deleteIncome(income.value.id).catch(() => undefined);
    });
}

// Destructive, so behind the menu rather than beside Edit.
const menu = computed<ResponsiveMenuItem[]>(() =>
  can('event.income.delete')
    ? [
        {
          label: t('finance.action.delete'),
          icon: 'delete',
          color: 'negative',
          onClick: remove,
        },
      ]
    : [],
);
</script>

<i18n lang="yaml" locale="en">
kind: 'Income'
actions: 'Income actions'
edit: 'Edit'
receivedOn: 'Received on'
promised: 'Promised, not received yet'
payer: 'From'
document: 'Document'
deleteTitle: 'Delete {label}?'
deleteMessage: 'Its number is not given out again.'
</i18n>

<i18n lang="yaml" locale="de">
kind: 'Einnahme'
actions: 'Aktionen für die Einnahme'
edit: 'Bearbeiten'
receivedOn: 'Eingegangen am'
promised: 'Zugesagt, noch nicht eingegangen'
payer: 'Von'
document: 'Dokument'
deleteTitle: '{label} löschen?'
deleteMessage: 'Die Nummer wird nicht erneut vergeben.'
</i18n>

<i18n lang="yaml" locale="fr">
kind: 'Recette'
actions: 'Actions sur la recette'
edit: 'Modifier'
receivedOn: 'Reçu le'
promised: 'Promis, pas encore reçu'
payer: 'De'
document: 'Document'
deleteTitle: 'Supprimer {label} ?'
deleteMessage: 'Son numéro ne sera pas réattribué.'
</i18n>

<i18n lang="yaml" locale="pl">
kind: 'Przychód'
actions: 'Działania dla przychodu'
edit: 'Edytuj'
receivedOn: 'Data wpływu'
promised: 'Obiecano, jeszcze nie wpłynęło'
payer: 'Od'
document: 'Dokument'
deleteTitle: 'Usunąć {label}?'
deleteMessage: 'Jego numer nie zostanie użyty ponownie.'
</i18n>

<i18n lang="yaml" locale="cs">
kind: 'Příjem'
actions: 'Akce pro příjem'
edit: 'Upravit'
receivedOn: 'Přijato dne'
promised: 'Přislíbeno, zatím nepřijato'
payer: 'Od'
document: 'Dokument'
deleteTitle: 'Smazat {label}?'
deleteMessage: 'Jeho číslo se znovu nepřidělí.'
</i18n>
