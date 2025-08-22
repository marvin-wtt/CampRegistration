<template>
  <q-item
    clickable
    @click="emit('click')"
  >
    <q-item-section
      avatar
      :style="avatarBorderStyle"
      class="avatar-border"
    >
      <q-avatar>
        {{ expense.receiptNumber ?? '-' }}
      </q-avatar>
    </q-item-section>

    <q-item-section>
      <q-item-label>
        {{ expense.name }}
      </q-item-label>
      <q-item-label caption>
        {{ d(expense.date, 'short') }}
        <template v-if="expense?.category">
          &middot;
          {{ t('expense.category.' + expense.category) }}
        </template>
        <template v-if="expense?.paidBy">
          &middot;
          {{ expense.paidBy }}
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
      {{ n(expense.amount, 'currency') }}
    </q-item-section>

    <q-item-section
      v-if="slots.menu"
      side
    >
      <q-btn
        icon="more_vert"
        dense
        round
        flat
        @click.stop
      >
        <q-menu>
          <slot name="menu" />
        </q-menu>
      </q-btn>
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import type { Expense } from '@camp-registration/common/entities';
import { computed, type StyleValue } from 'vue';

const { t, d, n } = useI18n();

const { expense } = defineProps<{
  expense: Expense;
}>();

const slots = defineSlots<{
  menu?: () => unknown;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const isUnpaid = computed<boolean>(() => {
  if (expense.amount === 0) {
    return false;
  }

  return expense.paidBy == null || expense.paidAt == null;
});

const missingReceipt = computed<boolean>(() => {
  return expense.file == null;
});

const borderColor = (): string => {
  // Amount not defined
  if (expense.amount === 0) {
    return 'grey';
  }

  // Unpaid
  if (expense.paidBy == null || expense.paidAt == null) {
    return '#ff0000';
  }

  // No receipt
  if (expense.file == null) {
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
</script>

<i18n lang="yaml" locale="en">
tooltip:
  noFile: 'No file is attached to this expense'
  unpaid: 'This expense is not paid'
</i18n>

<i18n lang="yaml" locale="de">
tooltip:
  noFile: 'Dieser Ausgabe ist keine Datei beigefügt'
  unpaid: 'Diese Ausgabe ist nicht bezahlt'
</i18n>

<i18n lang="yaml" locale="fr">
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
