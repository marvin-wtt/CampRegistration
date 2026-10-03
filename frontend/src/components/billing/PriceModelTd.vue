<template>
  <q-td :props>
    <q-chip
      :class="chipClass"
      :icon
      dense
      square
    >
      {{ to(priceModel.name) }}
      <q-tooltip v-if="tooltip">{{ tooltip }}</q-tooltip>
    </q-chip>
    <div
      v-if="pendingOffer"
      class="pending-offer text-caption row items-center no-wrap"
    >
      <q-icon
        name="schedule"
        size="14px"
      />
      <span class="ellipsis">
        {{
          t('pending', {
            name: to(pendingOffer.priceModel.name),
            date: d(new Date(pendingOffer.effectiveAt), 'short'),
          })
        }}
      </span>
      <q-tooltip>{{ t('pendingHint') }}</q-tooltip>
    </div>
  </q-td>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PriceModelSummary } from '@camp-registration/common/entities';
import type { QTableBodyCellProps } from '@/types/quasar/QTableBodyCellProps';
import { useObjectTranslation } from '@/composables/objectTranslation';

const {
  props,
  priceModel,
  override = false,
  pendingOffer = null,
} = defineProps<{
  props: QTableBodyCellProps<unknown>;
  priceModel: PriceModelSummary;
  /** An event on another model than its organization is on now. */
  override?: boolean;
  /** Organizations: a price change it hasn't accepted yet. */
  pendingOffer?: { priceModel: PriceModelSummary; effectiveAt: string } | null;
}>();

const { t, d } = useI18n();
const { to } = useObjectTranslation();

// The normal case stays quiet: an organization on the default model, an
// event on its organization's. Anything else is a deliberate choice.
const chipClass = computed(() =>
  override || !priceModel.isDefault
    ? 'price-model--custom'
    : 'price-model--default',
);

// An icon, not a badge: "Standard" next to a model named Standard misreads.
const icon = computed(() => {
  if (override) {
    return 'sell';
  }
  return priceModel.isDefault ? 'star' : undefined;
});

const tooltip = computed(() => {
  if (override) {
    return t('override');
  }
  return priceModel.isDefault ? t('default') : undefined;
});
</script>

<style scoped lang="scss">
.pending-offer {
  gap: 4px;
  margin: 2px 4px 0;
  color: var(--md3-warning);
}

.price-model--default {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
}

.price-model--custom {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}
</style>

<i18n lang="yaml" locale="en">
pending: '→ {name} from {date}'
pendingHint: "Offered, not accepted yet. From that date, the organization can't create events until it accepts."
override: "Differs from the organization's current price model"
default: 'Default price model'
</i18n>

<i18n lang="yaml" locale="de">
pending: '→ {name} ab {date}'
pendingHint: 'Angeboten, noch nicht angenommen. Ab diesem Datum kann die Organisation keine Veranstaltungen anlegen, bis sie zustimmt.'
override: 'Weicht vom aktuellen Preismodell der Organisation ab'
default: 'Standard-Preismodell'
</i18n>

<i18n lang="yaml" locale="fr">
pending: '→ {name} à partir du {date}'
pendingHint: "Proposé, pas encore accepté. À partir de cette date, l'organisation ne peut plus créer d'événements tant qu'elle n'a pas accepté."
override: "Diffère du modèle tarifaire actuel de l'organisation"
default: 'Modèle tarifaire par défaut'
</i18n>

<i18n lang="yaml" locale="pl">
pending: '→ {name} od {date}'
pendingHint: 'Zaproponowano, jeszcze nie zaakceptowano. Od tej daty organizacja nie może tworzyć wydarzeń, dopóki nie zaakceptuje.'
override: 'Różni się od obecnego modelu cenowego organizacji'
default: 'Domyślny model cenowy'
</i18n>

<i18n lang="yaml" locale="cs">
pending: '→ {name} od {date}'
pendingHint: 'Nabídnuto, zatím nepřijato. Od tohoto data nemůže organizace vytvářet akce, dokud nový model nepřijme.'
override: 'Liší se od současného cenového modelu organizace'
default: 'Výchozí cenový model'
</i18n>
