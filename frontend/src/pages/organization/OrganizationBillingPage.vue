<template>
  <page-state-handler
    padding
    :error
    :loading="isLoading"
    class="row justify-center"
  >
    <div class="column col-sm-10 col-md-8 col-12 q-gutter-md">
      <div class="text-h6">{{ t('title') }}</div>

      <q-card
        v-if="priceModel"
        flat
        class="price-model-card rounded-lg"
      >
        <q-card-section>
          <div class="text-overline text-on-surface-variant">
            {{ t('priceModel.label') }}
          </div>
          <div class="text-subtitle1 text-weight-medium">
            {{ to(priceModel.name) }}
          </div>
        </q-card-section>

        <q-card-section class="price-model-rates q-pt-none">
          <div>
            <div class="text-caption text-on-surface-variant">
              {{ t('priceModel.pricePerRegistration') }}
            </div>
            <div class="text-body1">
              {{ money(priceModel.pricePerRegistration, priceModel.currency) }}
            </div>
          </div>
          <div>
            <div class="text-caption text-on-surface-variant">
              {{ t('priceModel.baseFee') }}
            </div>
            <div class="text-body1">
              {{ money(priceModel.baseFee, priceModel.currency) }}
            </div>
          </div>
          <div>
            <div class="text-caption text-on-surface-variant">
              {{ t('priceModel.taxRate') }}
            </div>
            <div class="text-body1">
              {{ Number(priceModel.taxRate).toLocaleString(locale) }} %
            </div>
          </div>
        </q-card-section>

        <q-card-section class="text-caption text-on-surface-variant q-pt-none">
          {{ t('explanation') }}
        </q-card-section>
      </q-card>

      <div class="text-subtitle1 text-weight-medium q-mt-lg">
        {{ t('bills') }}
      </div>

      <q-list
        v-if="bills.length > 0"
        bordered
        separator
        class="rounded-lg"
      >
        <q-item
          v-for="bill in bills"
          :key="bill.id"
        >
          <q-item-section>
            <q-item-label class="bill-title">
              <span>{{ to(bill.eventName) }}</span>
              <q-chip
                v-if="bill.priceModel && deviates(bill.priceModel)"
                :label="to(bill.priceModel.name)"
                class="override-chip q-ma-none"
                icon="sell"
                dense
                square
              />
            </q-item-label>
            <q-item-label caption>
              {{ formatBillPeriod(bill, locale) }} ·
              {{
                t(
                  bill.status === 'DRAFT' ? 'peak' : 'registrations',
                  { count: bill.registrationCount },
                  bill.registrationCount,
                )
              }}
            </q-item-label>
            <q-item-label v-if="bill.invoices.length > 0">
              <invoice-links
                :invoices="bill.invoices"
                :owner="{ organizationId }"
              />
            </q-item-label>
          </q-item-section>

          <q-item-section
            side
            class="items-end"
          >
            <div class="row items-center no-wrap q-gutter-x-sm">
              <event-bill-status-chip
                :status="bill.status"
                class="q-ma-none"
              />
              <span
                v-if="bill.grossAmount !== null"
                :class="{ 'bill-amount--void': bill.status === 'VOID' }"
                class="text-body1 text-weight-medium text-on-surface"
              >
                {{ money(bill.grossAmount, bill.currency) }}
              </span>
            </div>
            <div
              v-if="bill.taxAmount !== null && bill.taxAmount !== '0.00'"
              class="text-caption"
            >
              {{
                t('tax', {
                  net: money(bill.netAmount, bill.currency),
                  tax: money(bill.taxAmount, bill.currency),
                })
              }}
            </div>
          </q-item-section>
        </q-item>
      </q-list>

      <div
        v-else-if="!isLoading"
        class="column items-center q-pa-xl text-on-surface-variant"
      >
        <q-icon
          name="receipt_long"
          size="3rem"
        />
        <div class="text-subtitle1 q-mt-md">{{ t('empty') }}</div>
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import EventBillStatusChip from '@/components/billing/EventBillStatusChip.vue';
import InvoiceLinks from '@/components/billing/InvoiceLinks.vue';
import { useOrganizationBillingStore } from '@/stores/organization-billing-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formatMoney } from '@/utils/money';
import { formatBillPeriod } from '@/utils/billing';

const { t, locale } = useI18n();
const { to } = useObjectTranslation();
const store = useOrganizationBillingStore();
const route = useRoute();
const organizationId = route.params.organizationId as string;
const { data, isLoading, error } = storeToRefs(store);

const priceModel = computed(() => data.value?.priceModel);
const bills = computed(() => data.value?.bills ?? []);

/** Bills priced with another model than the organization's current one. */
function deviates(model: { id: string }): boolean {
  return model.id !== priceModel.value?.id;
}

function money(amount: string | null, currency: string | null): string {
  return formatMoney(amount, currency, locale.value);
}

void store.fetchData();
</script>

<style lang="scss" scoped>
.override-chip {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

.price-model-card {
  background: var(--md3-surface-container);
  color: var(--md3-on-surface);
}

.price-model-rates {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 40px;
}

.bill-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
}

.bill-amount--void {
  color: var(--md3-on-surface-variant);
  text-decoration: line-through;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Billing'
bills: 'Bills'
priceModel:
  label: 'Price model'
  pricePerRegistration: 'Per registration'
  baseFee: 'Base fee per event'
  taxRate: 'Tax'
explanation: 'Each event is billed after it ends. Accepted registrations are counted when the event starts and when it ends, and the higher number is billed — pending and waitlisted registrations are not counted.'
peak: '{ count } registration at start | { count } registrations at start'
registrations: '{ count } registration | { count } registrations'
tax: '{net} + {tax} tax'
empty: 'No events have been billed yet'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Abrechnung'
bills: 'Rechnungen'
priceModel:
  label: 'Preismodell'
  pricePerRegistration: 'Pro Anmeldung'
  baseFee: 'Grundgebühr pro Veranstaltung'
  taxRate: 'Steuer'
explanation: 'Jede Veranstaltung wird nach ihrem Ende abgerechnet. Die angenommenen Anmeldungen werden zu Beginn und am Ende der Veranstaltung gezählt, abgerechnet wird die höhere Zahl — offene Anmeldungen und Anmeldungen auf der Warteliste zählen nicht.'
peak: '{ count } Anmeldung zu Beginn | { count } Anmeldungen zu Beginn'
registrations: '{ count } Anmeldung | { count } Anmeldungen'
tax: '{net} + {tax} Steuer'
empty: 'Es wurden noch keine Veranstaltungen abgerechnet'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Facturation'
bills: 'Factures'
priceModel:
  label: 'Modèle tarifaire'
  pricePerRegistration: 'Par inscription'
  baseFee: 'Frais de base par événement'
  taxRate: 'Taxe'
explanation: "Chaque événement est facturé après sa fin. Les inscriptions acceptées sont comptées au début et à la fin de l'événement, et le nombre le plus élevé est facturé — les inscriptions en attente et sur liste d'attente ne sont pas comptées."
peak: '{ count } inscription au début | { count } inscriptions au début'
registrations: '{ count } inscription | { count } inscriptions'
tax: '{net} + {tax} de taxe'
empty: "Aucun événement n'a encore été facturé"
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Rozliczenia'
bills: 'Rachunki'
priceModel:
  label: 'Model cenowy'
  pricePerRegistration: 'Za zgłoszenie'
  baseFee: 'Opłata podstawowa za wydarzenie'
  taxRate: 'Podatek'
explanation: 'Każde wydarzenie jest rozliczane po jego zakończeniu. Zaakceptowane zgłoszenia są liczone na początku i na końcu wydarzenia, a rozliczana jest wyższa liczba — zgłoszenia oczekujące i z listy rezerwowej nie są liczone.'
peak: 'Zgłoszenia na początku: { count }'
registrations: 'Zgłoszenia: { count }'
tax: '{net} + {tax} podatku'
empty: 'Żadne wydarzenie nie zostało jeszcze rozliczone'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Vyúčtování'
bills: 'Faktury'
priceModel:
  label: 'Cenový model'
  pricePerRegistration: 'Za přihlášku'
  baseFee: 'Základní poplatek za akci'
  taxRate: 'Daň'
explanation: 'Každá akce se vyúčtuje po svém skončení. Přijaté přihlášky se počítají na začátku a na konci akce a účtuje se vyšší počet — čekající přihlášky a přihlášky na čekací listině se nepočítají.'
peak: 'Přihlášky na začátku: { count }'
registrations: 'Přihlášky: { count }'
tax: '{net} + {tax} daň'
empty: 'Zatím nebyla vyúčtována žádná akce'
</i18n>
