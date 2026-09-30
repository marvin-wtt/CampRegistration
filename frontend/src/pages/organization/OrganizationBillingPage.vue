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

        <q-card-section class="row q-col-gutter-md q-pt-none">
          <div class="col-12 col-sm-4">
            <div class="text-caption text-on-surface-variant">
              {{ t('priceModel.pricePerRegistration') }}
            </div>
            <div class="text-body1">
              {{ money(priceModel.pricePerRegistration, priceModel.currency) }}
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="text-caption text-on-surface-variant">
              {{ t('priceModel.baseFee') }}
            </div>
            <div class="text-body1">
              {{ money(priceModel.baseFee, priceModel.currency) }}
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="text-caption text-on-surface-variant">
              {{ t('priceModel.taxRate') }}
            </div>
            <div class="text-body1">{{ priceModel.taxRate }} %</div>
          </div>
        </q-card-section>

        <q-card-section class="text-caption text-on-surface-variant q-pt-none">
          {{ t('explanation') }}
        </q-card-section>
      </q-card>

      <template v-if="eventOverrides.length > 0">
        <div class="text-subtitle1 text-weight-medium q-mt-lg">
          {{ t('overrides.title') }}
        </div>
        <div class="text-caption text-on-surface-variant">
          {{ t('overrides.caption') }}
        </div>

        <q-list
          bordered
          separator
          class="rounded-lg"
        >
          <q-item
            v-for="override in eventOverrides"
            :key="override.eventId"
          >
            <q-item-section>
              <q-item-label>{{ to(override.eventName) }}</q-item-label>
              <q-item-label caption>
                {{
                  formatBillPeriod(
                    {
                      eventStartAt: override.eventStartAt,
                      eventEndAt: override.eventEndAt,
                    },
                    locale,
                  )
                }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-chip
                class="override-chip"
                icon="sell"
                dense
                square
              >
                {{ to(override.priceModel.name) }}
              </q-chip>
              <div class="text-caption">
                {{
                  t('overrides.price', {
                    price: money(
                      override.priceModel.pricePerRegistration,
                      override.priceModel.currency,
                    ),
                  })
                }}
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </template>

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
            <q-item-label caption>
              {{ formatBillPeriod(bill, locale) }}
            </q-item-label>
            <q-item-label caption>
              {{
                bill.status === 'DRAFT'
                  ? t(
                      'peak',
                      { count: bill.registrationCount },
                      bill.registrationCount,
                    )
                  : t(
                      'registrations',
                      { count: bill.registrationCount },
                      bill.registrationCount,
                    )
              }}
            </q-item-label>
          </q-item-section>

          <q-item-section
            side
            class="items-end"
          >
            <div
              v-if="bill.grossAmount !== null"
              class="text-body1 text-weight-medium text-on-surface"
            >
              {{ money(bill.grossAmount, bill.currency) }}
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
            <event-bill-status-chip :status="bill.status" />
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
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import EventBillStatusChip from '@/components/billing/EventBillStatusChip.vue';
import { useOrganizationBillingStore } from '@/stores/organization-billing-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formatMoney } from '@/utils/money';
import { formatBillPeriod } from '@/utils/billing';

const { t, locale } = useI18n();
const { to } = useObjectTranslation();
const store = useOrganizationBillingStore();
const { data, isLoading, error } = storeToRefs(store);

const priceModel = computed(() => data.value?.priceModel);
const bills = computed(() => data.value?.bills ?? []);
const eventOverrides = computed(() => data.value?.eventOverrides ?? []);

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
</style>

<i18n lang="yaml" locale="en">
title: 'Billing'
bills: 'Bills'
overrides:
  title: 'Events with their own price model'
  caption: 'These events are billed with the model shown instead of the one above.'
  price: '{price} per registration'
priceModel:
  label: 'Price model'
  pricePerRegistration: 'Per registration'
  baseFee: 'Base fee per event'
  taxRate: 'Tax'
explanation: 'Each event is billed after it ends. Accepted registrations are counted when the event starts and when it ends, and the higher number is billed — pending and waitlisted registrations are not counted.'
peak: 'Running · { count } registration at start | Running · { count } registrations at start'
registrations: '{ count } registration | { count } registrations'
tax: '{net} + {tax} tax'
empty: 'No events have been billed yet'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Abrechnung'
bills: 'Rechnungen'
overrides:
  title: 'Veranstaltungen mit eigenem Preismodell'
  caption: 'Diese Veranstaltungen werden mit dem angezeigten Modell statt dem obigen abgerechnet.'
  price: '{price} pro Anmeldung'
priceModel:
  label: 'Preismodell'
  pricePerRegistration: 'Pro Anmeldung'
  baseFee: 'Grundgebühr pro Veranstaltung'
  taxRate: 'Steuer'
explanation: 'Jede Veranstaltung wird nach ihrem Ende abgerechnet. Die angenommenen Anmeldungen werden zu Beginn und am Ende der Veranstaltung gezählt, abgerechnet wird die höhere Zahl — offene Anmeldungen und Anmeldungen auf der Warteliste zählen nicht.'
peak: 'Laufend · { count } Anmeldung zu Beginn | Laufend · { count } Anmeldungen zu Beginn'
registrations: '{ count } Anmeldung | { count } Anmeldungen'
tax: '{net} + {tax} Steuer'
empty: 'Es wurden noch keine Veranstaltungen abgerechnet'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Facturation'
bills: 'Factures'
overrides:
  title: 'Événements avec leur propre modèle tarifaire'
  caption: 'Ces événements sont facturés avec le modèle indiqué au lieu de celui ci-dessus.'
  price: '{price} par inscription'
priceModel:
  label: 'Modèle tarifaire'
  pricePerRegistration: 'Par inscription'
  baseFee: 'Frais de base par événement'
  taxRate: 'Taxe'
explanation: "Chaque événement est facturé après sa fin. Les inscriptions acceptées sont comptées au début et à la fin de l'événement, et le nombre le plus élevé est facturé — les inscriptions en attente et sur liste d'attente ne sont pas comptées."
peak: 'En cours · { count } inscription au début | En cours · { count } inscriptions au début'
registrations: '{ count } inscription | { count } inscriptions'
tax: '{net} + {tax} de taxe'
empty: "Aucun événement n'a encore été facturé"
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Rozliczenia'
bills: 'Rachunki'
overrides:
  title: 'Wydarzenia z własnym modelem cenowym'
  caption: 'Te wydarzenia są rozliczane według wskazanego modelu zamiast powyższego.'
  price: '{price} za zgłoszenie'
priceModel:
  label: 'Model cenowy'
  pricePerRegistration: 'Za zgłoszenie'
  baseFee: 'Opłata podstawowa za wydarzenie'
  taxRate: 'Podatek'
explanation: 'Każde wydarzenie jest rozliczane po jego zakończeniu. Zaakceptowane zgłoszenia są liczone na początku i na końcu wydarzenia, a rozliczana jest wyższa liczba — zgłoszenia oczekujące i z listy rezerwowej nie są liczone.'
peak: 'W toku · zgłoszenia na początku: { count }'
registrations: 'Zgłoszenia: { count }'
tax: '{net} + {tax} podatku'
empty: 'Żadne wydarzenie nie zostało jeszcze rozliczone'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Vyúčtování'
bills: 'Faktury'
overrides:
  title: 'Akce s vlastním cenovým modelem'
  caption: 'Tyto akce se účtují podle uvedeného modelu místo modelu výše.'
  price: '{price} za přihlášku'
priceModel:
  label: 'Cenový model'
  pricePerRegistration: 'Za přihlášku'
  baseFee: 'Základní poplatek za akci'
  taxRate: 'Daň'
explanation: 'Každá akce se vyúčtuje po svém skončení. Přijaté přihlášky se počítají na začátku a na konci akce a účtuje se vyšší počet — čekající přihlášky a přihlášky na čekací listině se nepočítají.'
peak: 'Probíhá · přihlášky na začátku: { count }'
registrations: 'Přihlášky: { count }'
tax: '{net} + {tax} daň'
empty: 'Zatím nebyla vyúčtována žádná akce'
</i18n>
