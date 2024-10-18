<template>
  <!-- TODO Add payment status -->
  <q-item
    clickable
    @click="onItemClick"
  >
    <q-item-section avatar>
      <q-avatar
        :color="avatarColor"
        :text-color="avatarTextColor"
      >
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
      v-if="!isPaid"
      side
    >
      <q-btn
        icon="priority_high"
        color="negative"
        flat
        round
        @click.stop
      />
    </q-item-section>
    <q-item-section
      v-else-if="!hasReceipt"
      side
    >
      <q-btn
        icon="priority_high"
        color="warning"
        flat
        round
        @click.stop
      />
    </q-item-section>

    <q-item-section
      class="text-bold"
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
import { NamedColor, useQuasar } from 'quasar';
import ExpenseDetailsDialog from 'components/campManagement/expenses/ExpenseDetailsDialog.vue';
import ExpenseUpdateDialog from 'components/campManagement/expenses/ExpenseUpdateDialog.vue';
import { useExpensesStore } from 'stores/expense-store.ts';
import { computed } from 'vue';

const { t, d, n } = useI18n();
const quasar = useQuasar();
const expensesStore = useExpensesStore();

const props = defineProps<{
  expense: Expense;
}>();

const isPaid = computed<boolean>(() => {
  return props.expense.paidBy == null || props.expense.paidAt === null;
});

const hasReceipt = computed<boolean>(() => {
  return props.expense.file != null;
});

const avatarColor = computed<NamedColor | undefined>(() => {
  return isPaid.value ? undefined : 'negative';
});

const avatarTextColor = computed<string | undefined>(() => {
  return isPaid.value ? undefined : 'white';
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
</i18n>

<style scoped></style>
