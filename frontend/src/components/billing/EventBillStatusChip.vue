<template>
  <q-chip
    :class="`bill-status bill-status--${status.toLowerCase()}`"
    dense
    square
  >
    {{ t(status) }}
  </q-chip>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import type { EventBillStatus } from '@camp-registration/common/entities';

const { status } = defineProps<{
  status: EventBillStatus;
}>();

const { t } = useI18n();
</script>

<style scoped lang="scss">
.bill-status--draft {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.bill-status--open {
  background: var(--md3-warning-container);
  color: var(--md3-on-warning-container);
}

.bill-status--paid {
  background: var(--md3-positive-container);
  color: var(--md3-on-positive-container);
}

.bill-status--void {
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
DRAFT: 'Running'
OPEN: 'Open'
PAID: 'Paid'
VOID: 'Void'
</i18n>

<i18n lang="yaml" locale="de">
DRAFT: 'Laufend'
OPEN: 'Offen'
PAID: 'Bezahlt'
VOID: 'Storniert'
</i18n>

<i18n lang="yaml" locale="fr">
DRAFT: 'En cours'
OPEN: 'Ouverte'
PAID: 'Payée'
VOID: 'Annulée'
</i18n>

<i18n lang="yaml" locale="pl">
DRAFT: 'W toku'
OPEN: 'Otwarty'
PAID: 'Opłacony'
VOID: 'Anulowany'
</i18n>

<i18n lang="yaml" locale="cs">
DRAFT: 'Probíhá'
OPEN: 'Otevřená'
PAID: 'Zaplacená'
VOID: 'Stornovaná'
</i18n>
