<template>
  <q-page class="print-page">
    <div
      v-if="error"
      class="q-pa-md"
    >
      <q-banner
        rounded
        class="bg-negative text-white"
      >
        {{ error }}
      </q-banner>
    </div>

    <article
      v-else-if="data"
      class="print-sheet slip"
    >
      <!-- Header: what this is, and for which event -->
      <header class="slip-header">
        <div class="slip-heading">
          <div class="slip-eyebrow">
            {{ toAll(data.organizer) }} · {{ toAll(data.eventName) }}
          </div>
          <h1 class="slip-title">
            {{ data.direction === 'OUT' ? t('titleOut') : t('titleIn') }}
          </h1>
        </div>
        <div class="slip-number-box">
          <span class="slip-number-label">{{ t('number') }}</span>
          <span class="slip-number">{{ data.label }}</span>
          <!-- Usually signed before the transfer, so "open" would only go stale. -->
          <span
            v-if="data.paidOn"
            class="slip-status"
          >
            {{ t('paidOn', { date: data.paidOn }) }}
          </span>
        </div>
      </header>

      <!-- Who, by whom, and what for -->
      <section class="slip-meta">
        <div class="slip-meta-item">
          <span class="slip-meta-label">{{ t('person') }}</span>
          <span class="slip-meta-value">{{ data.recipientName }}</span>
        </div>
        <div class="slip-meta-item">
          <span class="slip-meta-label">{{ t('createdBy') }}</span>
          <span class="slip-meta-value">
            {{
              data.createdByName
                ? t('createdByValue', {
                    name: data.createdByName,
                    date: data.createdOn,
                  })
                : data.createdOn
            }}
          </span>
        </div>
        <div
          v-if="data.note"
          class="slip-meta-item"
        >
          <span class="slip-meta-label">{{ t('note') }}</span>
          <span class="slip-meta-value">{{ data.note }}</span>
        </div>
      </section>

      <!-- The receipts the person paid -->
      <section>
        <h2 class="slip-section-title">{{ t('receipts') }}</h2>
        <table class="slip-table">
          <thead>
            <tr>
              <th class="col-number">{{ t('receipt') }}</th>
              <th class="col-date">{{ t('date') }}</th>
              <th>{{ t('description') }}</th>
              <th class="num">{{ t('amount') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="expense in data.expenses"
              :key="expense.number"
            >
              <td class="mono">{{ expense.number }}</td>
              <td>{{ expense.date }}</td>
              <td>{{ expense.description }}</td>
              <td class="num">{{ expense.amount }}</td>
            </tr>
            <tr v-if="data.expenses.length === 0">
              <td
                colspan="4"
                class="slip-empty"
              >
                {{ t('noExpenses') }}
              </td>
            </tr>
          </tbody>
        </table>

        <div class="slip-totals">
          <div
            v-for="total in data.totals"
            :key="total.label"
            class="slip-total"
            :class="{ 'slip-total--strong': total.strong }"
          >
            <span>{{ total.label }}</span>
            <span class="num">{{ total.amount }}</span>
          </div>
        </div>
      </section>

      <!-- What the person confirms, and their signature -->
      <section class="slip-confirmation">
        <h2 class="slip-section-title">{{ t('declaration') }}</h2>
        <p class="slip-declaration">{{ data.declaration }}</p>

        <div class="slip-signature">
          <svg
            v-if="data.signature"
            :viewBox="`0 0 ${SIGNATURE_VIEWBOX.width} ${SIGNATURE_VIEWBOX.height}`"
            class="slip-signature-image"
            role="img"
            :aria-label="t('signature', { name: data.recipientName })"
          >
            <path :d="data.signature" />
          </svg>
          <div
            v-else
            class="slip-signature-space"
          />
          <div class="slip-signature-line" />
          <div class="slip-signature-caption">
            {{
              data.signedAt
                ? t('signedOn', {
                    name: data.recipientName,
                    date: data.signedAt,
                  })
                : t('signRecipient', { name: data.recipientName })
            }}
          </div>
        </div>
      </section>
    </article>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { SIGNATURE_VIEWBOX } from '@camp-registration/common/entities';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { usePrintPage, waitForStableLayout } from '@/composables/printPage';
import type { PrintPayoutSlipPayload } from '@/components/event/finances/printPayoutSlip';

const { t } = useI18n();
const { toAll } = useObjectTranslation();

const { payload: data, error } = usePrintPage<PrintPayoutSlipPayload>({
  messagePrefix: 'PRINT_PAYOUT',
  prepare: () => waitForStableLayout(),
});
</script>

<style scoped>
/* Paper is white: the light theme's tokens, so it stays on brand in print. */
.slip {
  --slip-accent: var(--md3-primary--light);
  --slip-accent-soft: var(--md3-primary-container--light);
  --slip-on-accent-soft: var(--md3-on-primary-container--light);
  --slip-text: var(--md3-on-surface--light);
  --slip-muted: var(--md3-on-surface-variant--light);
  --slip-line: var(--md3-outline-variant--light);
  --slip-tint: var(--md3-surface-container--light);

  display: flex;
  flex-direction: column;
  gap: 8mm;
  color: var(--slip-text);
  font-size: 10pt;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}

.slip-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8mm;
  padding-bottom: 5mm;
  border-bottom: 2px solid var(--slip-accent);
}

.slip-eyebrow {
  font-size: 9pt;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--slip-muted);
}

.slip-title {
  margin: 2mm 0 0;
  font-size: 22pt;
  font-weight: 500;
  line-height: 1.15;
  color: var(--slip-accent);
}

.slip-number-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1.5mm;
  min-width: 38mm;
}

.slip-number-label {
  font-size: 8pt;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--slip-muted);
}

.slip-number {
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: 24pt;
  font-weight: 700;
  line-height: 1;
}

.slip-status {
  padding: 1mm 3mm;
  border-radius: 999px;
  font-size: 8.5pt;
  font-weight: 500;
  background: var(--slip-accent-soft);
  color: var(--slip-on-accent-soft);
}

.slip-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4mm;
  padding: 4mm 5mm;
  border-radius: 3mm;
  background: var(--slip-tint);
}

.slip-meta-item {
  display: flex;
  flex-direction: column;
  gap: 1mm;
}

.slip-meta-label {
  font-size: 8pt;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--slip-muted);
}

.slip-meta-value {
  font-size: 10.5pt;
  font-weight: 500;
}

.slip-section-title {
  margin: 0 0 2.5mm;
  font-size: 11pt;
  font-weight: 500;
  color: var(--slip-accent);
}

.slip-table {
  width: 100%;
  border-collapse: collapse;
}

.slip-table th {
  padding: 2mm 3mm;
  text-align: left;
  font-size: 8.5pt;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--slip-on-accent-soft);
  background: var(--slip-accent-soft);
}

.slip-table th:first-child {
  border-radius: 2mm 0 0 2mm;
}

.slip-table th:last-child {
  border-radius: 0 2mm 2mm 0;
}

.slip-table td {
  padding: 2mm 3mm;
  border-bottom: 1px solid var(--slip-line);
}

.slip-table tbody tr:nth-child(even) td {
  background: var(--slip-tint);
}

.slip-table tr {
  break-inside: avoid;
}

.col-number {
  width: 18mm;
}

.col-date {
  width: 28mm;
}

.slip-empty {
  color: var(--slip-muted);
  font-style: italic;
}

.slip-totals {
  margin: 4mm 0 0 auto;
  width: 82mm;
  display: flex;
  flex-direction: column;
  gap: 1.5mm;
  break-inside: avoid;
}

.slip-total {
  display: flex;
  justify-content: space-between;
  gap: 4mm;
  color: var(--slip-muted);
}

.slip-total--strong {
  color: var(--slip-text);
  font-weight: 700;
}

.slip-total:last-child {
  margin-top: 1mm;
  padding: 2mm 3mm;
  border-radius: 2mm;
  color: var(--slip-on-accent-soft);
  background: var(--slip-accent-soft);
  font-weight: 700;
}

.slip-confirmation {
  break-inside: avoid;
}

.slip-declaration {
  margin: 0;
  padding: 4mm 5mm;
  border-radius: 3mm;
  background: var(--slip-tint);
  font-size: 10.5pt;
  line-height: 1.55;
}

.slip-signature {
  width: 90mm;
  margin-top: 8mm;
}

.slip-signature-image,
.slip-signature-space {
  display: block;
  width: 100%;
  height: 26mm;
}

.slip-signature-image path {
  fill: none;
  stroke: var(--slip-text);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.slip-signature-line {
  border-bottom: 1px solid var(--slip-text);
}

.slip-signature-caption {
  margin-top: 1.5mm;
  font-size: 8.5pt;
  color: var(--slip-muted);
}

.num {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.mono {
  font-family: 'Roboto Mono', ui-monospace, monospace;
}
</style>

<i18n lang="yaml" locale="en">
titleOut: 'Reimbursement statement'
titleIn: 'Receipt for money returned'
number: 'No.'
paidOn: 'Paid on {date}'
person: 'Person'
createdBy: 'Created by'
createdByValue: '{name}, {date}'
note: 'Note'
receipts: 'Receipts'
receipt: 'Receipt'
date: 'Date'
description: 'Description'
amount: 'Amount'
noExpenses: 'No receipts recorded for this person.'
declaration: 'Declaration'
signature: 'Signature of {name}'
signedOn: '{name} · signed {date}'
signRecipient: 'Date, signature of {name}'
</i18n>

<i18n lang="yaml" locale="de">
titleOut: 'Auslagenerstattung'
titleIn: 'Quittung über zurückgezahltes Geld'
number: 'Nr.'
paidOn: 'Bezahlt am {date}'
person: 'Person'
createdBy: 'Erstellt von'
createdByValue: '{name}, {date}'
note: 'Notiz'
receipts: 'Belege'
receipt: 'Beleg'
date: 'Datum'
description: 'Beschreibung'
amount: 'Betrag'
noExpenses: 'Für diese Person sind keine Belege erfasst.'
declaration: 'Erklärung'
signature: 'Unterschrift von {name}'
signedOn: '{name} · unterschrieben am {date}'
signRecipient: 'Datum, Unterschrift von {name}'
</i18n>

<i18n lang="yaml" locale="fr">
titleOut: 'Note de remboursement'
titleIn: "Reçu d'argent restitué"
number: 'N°'
paidOn: 'Payé le {date}'
person: 'Personne'
createdBy: 'Établi par'
createdByValue: '{name}, {date}'
note: 'Note'
receipts: 'Justificatifs'
receipt: 'Justificatif'
date: 'Date'
description: 'Description'
amount: 'Montant'
noExpenses: 'Aucun justificatif enregistré pour cette personne.'
declaration: 'Déclaration'
signature: 'Signature de {name}'
signedOn: '{name} · signé le {date}'
signRecipient: 'Date, signature de {name}'
</i18n>

<i18n lang="yaml" locale="pl">
titleOut: 'Rozliczenie wydatków'
titleIn: 'Pokwitowanie zwrotu pieniędzy'
number: 'Nr'
paidOn: 'Zapłacono {date}'
person: 'Osoba'
createdBy: 'Utworzył(a)'
createdByValue: '{name}, {date}'
note: 'Notatka'
receipts: 'Paragony'
receipt: 'Paragon'
date: 'Data'
description: 'Opis'
amount: 'Kwota'
noExpenses: 'Brak paragonów zapisanych dla tej osoby.'
declaration: 'Oświadczenie'
signature: 'Podpis: {name}'
signedOn: '{name} · podpisano {date}'
signRecipient: 'Data, podpis: {name}'
</i18n>

<i18n lang="yaml" locale="cs">
titleOut: 'Vyúčtování výdajů'
titleIn: 'Potvrzení o vrácených penězích'
number: 'Č.'
paidOn: 'Zaplaceno {date}'
person: 'Osoba'
createdBy: 'Vytvořil(a)'
createdByValue: '{name}, {date}'
note: 'Poznámka'
receipts: 'Doklady'
receipt: 'Doklad'
date: 'Datum'
description: 'Popis'
amount: 'Částka'
noExpenses: 'Pro tuto osobu nejsou zaznamenány žádné doklady.'
declaration: 'Prohlášení'
signature: 'Podpis: {name}'
signedOn: '{name} · podepsáno {date}'
signRecipient: 'Datum, podpis: {name}'
</i18n>
