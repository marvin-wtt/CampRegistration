<template>
  <q-item
    clickable
    @click="onItemClick"
  >
    <q-item-section
      avatar
      :style="avatarBorderStyle"
      class="avatar-border"
    >
      <q-avatar>
        {{ props.expense.receiptNumber ?? '-' }}
      </q-avatar>
    </q-item-section>

    <q-item-section>
      <q-item-label>
        {{ props.expense.name }}
      </q-item-label>
      <q-item-label caption>
        {{ d(props.expense.date, 'short') }}
        <template v-if="props.expense?.category">
          &middot;
          {{ props.expense.category }}
        </template>
      </q-item-label>
    </q-item-section>

    <q-item-section
      v-if="isUnpaid"
      side
    >
      <q-btn
        icon="euro"
        color="negative"
        flat
        round
        @click.stop
      >
        <q-tooltip>
          {{ t('tooltip.unpaid') }}
        </q-tooltip>
      </q-btn>
    </q-item-section>
    <q-item-section
      v-else-if="missingReceipt"
      side
    >
      <q-btn
        icon="attach_file"
        color="warning"
        flat
        round
        @click.stop
      >
        <q-tooltip>
          {{ t('tooltip.noFile') }}
        </q-tooltip>
      </q-btn>
    </q-item-section>

    <q-item-section
      class="text-bold text-caption"
      side
    >
      {{ n(props.expense.amount, 'currency') }}
    </q-item-section>

    <q-item-section side>
      <q-btn
        icon="more_vert"
        round
        flat
        @click.stop
      >
        <q-menu>
          <q-list style="min-width: 100px">
            <q-item
              v-close-popup
              clickable
              @click="onItemEdit"
            >
              <q-item-section>
                {{ t('action.edit') }}
              </q-item-section>
            </q-item>
            <q-item
              v-close-popup
              clickable
              @click="onItemDelete"
            >
              <q-item-section class="text-negative">
                {{ t('action.delete') }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { Expense } from '@camp-registration/common/entities';
import { useQuasar } from 'quasar';
import ExpenseDetailsDialog from 'components/campManagement/expenses/ExpenseDetailsDialog.vue';
import ExpenseUpdateDialog from 'components/campManagement/expenses/ExpenseUpdateDialog.vue';
import { useExpensesStore } from 'stores/expense-store.ts';
import { computed, StyleValue } from 'vue';

const { t, d, n } = useI18n();
const quasar = useQuasar();
const expensesStore = useExpensesStore();

const props = defineProps<{
  expense: Expense;
}>();

const isUnpaid = computed<boolean>(() => {
  if (props.expense.amount === 0) {
    return false;
  }

  return props.expense.paidBy == null || props.expense.paidAt == null;
});

const missingReceipt = computed<boolean>(() => {
  return props.expense.file == null;
});

const borderColor = (): string => {
  // Amount not defined
  if (props.expense.amount === 0) {
    return 'grey';
  }

  // Unpaid
  if (props.expense.paidBy == null || props.expense.paidAt == null) {
    return '#ff0000';
  }

  // No receipt
  if (props.expense.file == null) {
    return '#f1c037';
  }

  // Others
  return 'green';
};

const avatarBorderStyle = computed<StyleValue>(() => {
  return {
    borderLeftColor: borderColor(),
  };
});

function onItemClick() {
  quasar.dialog({
    component: ExpenseDetailsDialog,
    componentProps: {
      expense: props.expense,
    },
  });
}

function onItemEdit() {
  quasar.dialog({
    component: ExpenseUpdateDialog,
    componentProps: {
      expense: props.expense,
    },
  });
}

function onItemDelete() {
  quasar
    .dialog({
      title: t('dialog.delete.title', { name: props.expense.name }),
      message: t('dialog.delete.message'),
      ok: {
        label: t('action.delete'),
        rounded: true,
        color: 'negative',
      },
      cancel: {
        label: t('action.cancel'),
        color: 'primary',
        rounded: true,
        outline: true,
      },
    })
    .onOk(() => {
      expensesStore.deleteData(props.expense.id);
    });
}
</script>

<i18n lang="yaml" locale="en">
action:
  cancel: 'Cancel'
  delete: 'Delete'
  edit: 'Edit'

dialog:
  delete:
    title: 'Delete { name }?'
    message: 'Are you sure you want to delete this expense permanently?'

tooltip:
  noFile: 'No file is attached to this expense'
  unpaid: 'This expense is not paid'
</i18n>

<i18n lang="yaml" locale="de">
action:
  cancel: 'Abbrechen'
  delete: 'Löschen'
  edit: 'Bearbeiten'

dialog:
  delete:
    title: '{ name } löschen?'
    message: 'Möchtest du diese Ausgabe wirklich dauerhaft löschen?'

tooltip:
  noFile: 'Dieser Ausgabe ist keine Datei beigefügt'
  unpaid: 'Diese Ausgabe ist nicht bezahlt'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  cancel: 'Annuler'
  delete: 'Supprimer'
  edit: 'Modifier'

dialog:
  delete:
    title: 'Supprimer { name } ?'
    message: 'Voulez-vous vraiment supprimer cette dépense définitivement ?'

tooltip:
  noFile: "Aucun fichier n'est joint à cette dépense"
  unpaid: "Cette dépense n'est pas payée"
</i18n>

<style scoped>
.avatar-border {
  border-left-width: 2px;
  border-left-style: solid;
}
</style>
