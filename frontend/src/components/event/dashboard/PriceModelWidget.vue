<template>
  <q-card
    flat
    bordered
    class="price-model-widget"
  >
    <q-card-section class="price-model-content">
      <div class="price-model-icon row items-center justify-center">
        <q-icon
          name="sell"
          size="22px"
        />
      </div>

      <div class="price-model-name">
        <div class="text-caption text-on-surface-variant">
          {{ t('title') }}
        </div>
        <q-skeleton
          v-if="!priceModel"
          type="text"
          width="8rem"
          class="text-subtitle2"
        />
        <div
          v-else
          class="row items-center no-wrap q-gutter-x-sm"
        >
          <span class="text-subtitle2 text-weight-bold ellipsis">
            {{ to(priceModel.name) }}
          </span>
          <q-chip
            v-if="data?.isOverride"
            :label="t('override')"
            class="override-chip"
            dense
          />
        </div>
      </div>

      <div
        v-if="priceModel"
        class="price-model-estimate"
      >
        <div class="text-caption text-on-surface-variant">
          {{ t('estimate', { count: registrations }) }}
        </div>
        <div class="text-subtitle1 text-weight-bold">
          {{ money(estimate) }}
        </div>
        <div class="text-caption text-on-surface-variant">
          {{ breakdown }}
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useEventBillingStore } from '@/stores/event-billing-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formatMoney } from '@/utils/money';

const { registrations } = defineProps<{
  /** Accepted registrations — what the event would be billed for today. */
  registrations: number;
}>();

const { t, locale } = useI18n();
const { to } = useObjectTranslation();
const store = useEventBillingStore();
const { data } = storeToRefs(store);

void store.fetchData();

const priceModel = computed(() => data.value?.priceModel);

const cents = (amount: string) => Math.round(Number(amount) * 100);

// Mirrors the server's pricing in whole cents, rounding tax half-up.
const estimate = computed<string>(() => {
  if (!priceModel.value) {
    return '0';
  }
  const { baseFee, pricePerRegistration, taxRate } = priceModel.value;
  const net = cents(baseFee) + cents(pricePerRegistration) * registrations;
  const tax = Math.round((net * Number(taxRate)) / 100);

  return ((net + tax) / 100).toFixed(2);
});

const breakdown = computed<string>(() => {
  if (!priceModel.value) {
    return '';
  }
  const { baseFee, pricePerRegistration, taxRate } = priceModel.value;

  return t('breakdown', {
    price: money(pricePerRegistration),
    baseFee: money(baseFee),
    taxRate: Number(taxRate).toLocaleString(locale.value),
  });
});

function money(amount: string): string {
  return formatMoney(amount, priceModel.value?.currency ?? null, locale.value);
}
</script>

<style scoped lang="scss">
.price-model-widget {
  border-radius: 16px;
}

.price-model-content {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px 16px;

  @media (max-width: 599px) {
    grid-template-columns: auto minmax(0, 1fr);

    .price-model-estimate {
      grid-column: 1 / -1;
      text-align: left;
    }
  }
}

.price-model-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  color: var(--md3-on-secondary-container);
  background: var(--md3-secondary-container);
}

.price-model-estimate {
  text-align: right;
}

.override-chip {
  color: var(--md3-on-tertiary-container);
  background: var(--md3-tertiary-container);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Price model'
override: 'Own model'
estimate: 'Estimated cost · {count} registrations'
breakdown: '{price} per registration + {baseFee} base fee, incl. {taxRate} % tax'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Preismodell'
override: 'Eigenes Modell'
estimate: 'Voraussichtliche Kosten · {count} Anmeldungen'
breakdown: '{price} pro Anmeldung + {baseFee} Grundgebühr, inkl. {taxRate} % Steuer'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modèle tarifaire'
override: 'Modèle propre'
estimate: 'Coût estimé · {count} inscriptions'
breakdown: '{price} par inscription + {baseFee} de frais de base, dont {taxRate} % de taxe'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Model cenowy'
override: 'Własny model'
estimate: 'Szacowany koszt · zgłoszenia: {count}'
breakdown: '{price} za zgłoszenie + {baseFee} opłaty podstawowej, w tym {taxRate} % podatku'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Cenový model'
override: 'Vlastní model'
estimate: 'Odhadované náklady · přihlášky: {count}'
breakdown: '{price} za přihlášku + {baseFee} základní poplatek, vč. {taxRate} % daně'
</i18n>
