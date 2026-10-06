<template>
  <div class="invoice-links">
    <div
      v-for="invoice in invoices"
      :key="invoice.id"
      :class="{
        'invoice-pill--cancellation': invoice.type === 'CANCELLATION',
        'invoice-pill--pending': !isReady(invoice),
      }"
      class="invoice-pill rounded-full"
    >
      <a
        :href="isReady(invoice) ? invoiceUrl(owner, invoice.id) : undefined"
        :aria-disabled="!isReady(invoice)"
        class="invoice-pill__link"
        target="_blank"
        rel="noopener"
      >
        <q-spinner
          v-if="!isReady(invoice)"
          size="16px"
        />
        <q-icon
          v-else
          :name="invoice.type === 'CANCELLATION' ? 'undo' : 'picture_as_pdf'"
          size="16px"
        />
        <span class="invoice-pill__label">{{ label(invoice) }}</span>
        <span class="invoice-pill__date">
          {{ d(new Date(invoice.issuedAt), 'short') }}
        </span>
        <q-tooltip v-if="invoice.file">
          {{ invoice.file.name }} · {{ formatBytes(invoice.file.size, 1) }}
        </q-tooltip>
      </a>
      <q-btn
        v-if="removable && invoice.source === 'UPLOADED'"
        :aria-label="t('remove')"
        class="invoice-pill__remove"
        icon="close"
        size="xs"
        flat
        dense
        round
        @click="emit('remove', invoice)"
      >
        <q-tooltip>{{ t('remove') }}</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import type { Invoice } from '@camp-registration/common/entities';
import { invoiceUrl, type InvoiceOwner } from '@/utils/billing';
import { formatBytes } from '@/utils/formatters/formatBytes';

const { invoices, owner, removable } = defineProps<{
  invoices: Invoice[];
  owner: InvoiceOwner;
  /** Offers removing uploaded invoices; issued ones are cancelled instead. */
  removable?: boolean;
}>();

const emit = defineEmits<{
  remove: [invoice: Invoice];
}>();

const { t, d } = useI18n();

function isReady(invoice: Invoice): boolean {
  return invoice.file?.ready === true;
}

function label(invoice: Invoice): string {
  const kind = t(`type.${invoice.type}`);

  return invoice.number ? `${kind} ${invoice.number}` : kind;
}
</script>

<style scoped lang="scss">
.invoice-links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.invoice-pill {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface);
  transition: background-color 150ms;

  &:hover {
    background: var(--md3-surface-container-highest);
  }

  &--cancellation {
    background: var(--md3-error-container);
    color: var(--md3-on-error-container);

    &:hover {
      background: var(--md3-error-container);
    }
  }

  &--pending {
    opacity: 0.6;
  }
}

.invoice-pill__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 2px 10px;
  color: inherit;
  font-size: 0.8125rem;
  line-height: 20px;
  text-decoration: none;
  white-space: nowrap;

  &[aria-disabled='true'] {
    pointer-events: none;
  }

  .invoice-pill:has(.invoice-pill__remove) & {
    padding-right: 2px;
  }
}

.invoice-pill__label {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.invoice-pill__date {
  opacity: 0.72;
}

.invoice-pill__remove {
  margin-right: 2px;
}
</style>

<i18n lang="yaml" locale="en">
remove: 'Delete invoice'
type:
  INVOICE: 'Invoice'
  CANCELLATION: 'Cancellation'
</i18n>

<i18n lang="yaml" locale="de">
remove: 'Rechnung löschen'
type:
  INVOICE: 'Rechnung'
  CANCELLATION: 'Stornorechnung'
</i18n>

<i18n lang="yaml" locale="fr">
remove: 'Supprimer la facture'
type:
  INVOICE: 'Facture'
  CANCELLATION: "Facture d'annulation"
</i18n>

<i18n lang="yaml" locale="pl">
remove: 'Usuń fakturę'
type:
  INVOICE: 'Faktura'
  CANCELLATION: 'Faktura korygująca'
</i18n>

<i18n lang="yaml" locale="cs">
remove: 'Smazat fakturu'
type:
  INVOICE: 'Faktura'
  CANCELLATION: 'Opravný daňový doklad'
</i18n>
