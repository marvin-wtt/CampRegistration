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
        class="price-model-card rounded-lg overflow-hidden"
      >
        <!-- A pending change is shown in place: the rates read current → new. -->
        <price-model-offer-strip
          v-if="offer"
          :offer
          :organization-id="organizationId"
          :organization-name="organization?.name ?? ''"
          :can-accept="canOrg('organization.price_model.accept')"
          @accepted="reload"
        />

        <q-card-section>
          <div class="text-overline text-on-surface-variant">
            {{ t('priceModel.label') }}
          </div>
          <div class="price-model-change text-subtitle1 text-weight-medium">
            <span :class="{ 'text-on-surface-variant': offer }">
              {{ to(priceModel.name) }}
            </span>
            <template v-if="offer">
              <q-icon
                name="arrow_forward"
                size="18px"
                class="text-on-surface-variant"
              />
              <span>{{ to(offer.priceModel.name) }}</span>
            </template>
          </div>
        </q-card-section>

        <q-card-section class="price-model-rates q-pt-none">
          <div
            v-for="rate in rates"
            :key="rate.key"
          >
            <div class="text-caption text-on-surface-variant">
              {{ t(`priceModel.${rate.key}`) }}
            </div>
            <div class="price-model-change text-body1">
              <span :class="{ 'text-on-surface-variant': rate.next !== null }">
                {{ rate.current }}
              </span>
              <template v-if="rate.next !== null">
                <q-icon
                  name="arrow_forward"
                  size="16px"
                  class="text-on-surface-variant"
                />
                <span class="text-weight-medium">{{ rate.next }}</span>
                <q-icon
                  v-if="rate.increase"
                  name="arrow_upward"
                  size="16px"
                  class="price-model-increase"
                />
              </template>
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
            <q-item-label>{{ to(bill.eventName) }}</q-item-label>
            <q-item-label
              caption
              class="bill-meta"
            >
              <span>
                {{ formatBillPeriod(bill, locale) }} ·
                {{
                  t(
                    bill.status === 'DRAFT' ? 'peak' : 'registrations',
                    { count: bill.registrationCount },
                    bill.registrationCount,
                  )
                }}
              </span>
              <span
                v-if="bill.priceModel && deviates(bill.priceModel)"
                class="override-label"
              >
                <q-icon
                  name="sell"
                  size="14px"
                />
                {{ to(bill.priceModel.name) }}
              </span>
            </q-item-label>
            <q-item-label
              v-if="bill.invoices.length > 0"
              class="lt-md"
            >
              <invoice-links
                :invoices="bill.invoices"
                :owner="{ organizationId }"
              />
            </q-item-label>
          </q-item-section>

          <q-item-section
            v-if="bill.invoices.length > 0"
            class="gt-sm"
            side
          >
            <invoice-links
              :invoices="bill.invoices"
              :owner="{ organizationId }"
              class="bill-invoices"
            />
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
              v-if="bill.taxAmount !== null"
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
import PriceModelOfferStrip from '@/components/billing/PriceModelOfferStrip.vue';
import { useOrganizationDetailsStore } from '@/stores/organization-details-store';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';
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
const offer = computed(() => data.value?.offer ?? null);
const { data: organization } = storeToRefs(useOrganizationDetailsStore());
const { canOrg } = useOrganizationPermissions();

/** Each rate as it is now and, while a change is pending, as it will be. */
const rates = computed(() => {
  const current = priceModel.value;
  if (!current) {
    return [];
  }
  const next = offer.value?.priceModel ?? null;
  const amount = (value: string, currency: string) => money(value, currency);
  const percent = (value: string) =>
    `${Number(value).toLocaleString(locale.value)} %`;
  // Another currency can't be compared, so it reads as an increase.
  const higher = (a: string, b: string) =>
    next !== null &&
    (current.currency !== next.currency || Number(b) > Number(a));

  return [
    {
      key: 'pricePerRegistration',
      current: amount(current.pricePerRegistration, current.currency),
      next: next && amount(next.pricePerRegistration, next.currency),
      increase: higher(
        current.pricePerRegistration,
        next?.pricePerRegistration ?? '0',
      ),
    },
    {
      key: 'baseFee',
      current: amount(current.baseFee, current.currency),
      next: next && amount(next.baseFee, next.currency),
      increase: higher(current.baseFee, next?.baseFee ?? '0'),
    },
    {
      key: 'taxRate',
      current: percent(current.taxRate),
      next: next && percent(next.taxRate),
      increase: next !== null && Number(next.taxRate) > Number(current.taxRate),
    },
  ];
});

function reload() {
  store.invalidate();
  void store.fetchData();
}
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
.override-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--md3-tertiary);
  font-weight: 500;
}

.price-model-card {
  background: var(--md3-surface-container);
  color: var(--md3-on-surface);
}

.price-model-change {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
}

.price-model-increase {
  color: var(--md3-error);
}

.price-model-rates {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 40px;
}

.bill-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 12px;
}

.bill-invoices {
  flex-direction: column;
  align-items: flex-end;
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
