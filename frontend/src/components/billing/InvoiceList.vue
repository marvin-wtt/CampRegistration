<template>
  <q-list class="invoice-list">
    <q-item
      v-for="invoice in invoices"
      :key="invoice.id"
      :href="isReady(invoice) ? invoiceUrl(owner, invoice.id) : undefined"
      :disable="!isReady(invoice)"
      :clickable="isReady(invoice)"
      target="_blank"
      rel="noopener"
      class="invoice-item rounded-md"
    >
      <q-item-section avatar>
        <div
          :class="{ 'invoice-icon--cancellation': isCancellation(invoice) }"
          class="invoice-icon row items-center justify-center rounded-sm"
        >
          <q-spinner
            v-if="!isReady(invoice)"
            size="18px"
          />
          <q-icon
            v-else
            :name="isCancellation(invoice) ? 'undo' : 'picture_as_pdf'"
            size="20px"
          />
        </div>
      </q-item-section>

      <q-item-section>
        <q-item-label class="text-weight-medium">
          {{ label(invoice) }}
        </q-item-label>
        <q-item-label caption>
          {{ caption(invoice) }}
        </q-item-label>
      </q-item-section>

      <q-item-section side>
        <q-icon
          v-if="isReady(invoice)"
          name="open_in_new"
          size="18px"
          class="text-on-surface-variant"
        />
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import type { Invoice } from '@camp-registration/common/entities';
import { invoiceUrl, type InvoiceOwner } from '@/utils/billing';
import { formatBytes } from '@/utils/formatters/formatBytes';

const { invoices, owner } = defineProps<{
  invoices: Invoice[];
  owner: InvoiceOwner;
}>();

const { t, d } = useI18n();

function isReady(invoice: Invoice): boolean {
  return invoice.file?.ready === true;
}

function isCancellation(invoice: Invoice): boolean {
  return invoice.type === 'CANCELLATION';
}

function label(invoice: Invoice): string {
  const kind = t(`type.${invoice.type}`);

  return invoice.number ? `${kind} ${invoice.number}` : kind;
}

function caption(invoice: Invoice): string {
  if (!isReady(invoice)) {
    return t('pending');
  }
  const issued = t('issued', { date: d(new Date(invoice.issuedAt), 'short') });

  return invoice.file
    ? `${issued} · ${formatBytes(invoice.file.size, 1)}`
    : issued;
}
</script>

<style scoped lang="scss">
.invoice-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.invoice-item {
  background: var(--md3-surface-container-low);
}

.invoice-icon {
  width: 36px;
  height: 36px;
  color: var(--md3-on-primary-container);
  background: var(--md3-primary-container);

  &--cancellation {
    color: var(--md3-on-error-container);
    background: var(--md3-error-container);
  }
}
</style>

<i18n lang="yaml" locale="en">
issued: 'Issued {date}'
pending: 'Being stored…'
type:
  INVOICE: 'Invoice'
  CANCELLATION: 'Cancellation'
</i18n>

<i18n lang="yaml" locale="de">
issued: 'Ausgestellt am {date}'
pending: 'Wird gespeichert…'
type:
  INVOICE: 'Rechnung'
  CANCELLATION: 'Stornorechnung'
</i18n>

<i18n lang="yaml" locale="fr">
issued: 'Émise le {date}'
pending: 'Enregistrement…'
type:
  INVOICE: 'Facture'
  CANCELLATION: "Facture d'annulation"
</i18n>

<i18n lang="yaml" locale="pl">
issued: 'Wystawiono {date}'
pending: 'Zapisywanie…'
type:
  INVOICE: 'Faktura'
  CANCELLATION: 'Faktura korygująca'
</i18n>

<i18n lang="yaml" locale="cs">
issued: 'Vystaveno {date}'
pending: 'Ukládá se…'
type:
  INVOICE: 'Faktura'
  CANCELLATION: 'Opravný daňový doklad'
</i18n>
