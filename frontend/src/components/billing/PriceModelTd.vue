<template>
  <q-td :props>
    <div class="price-model-cell">
      <q-chip
        :class="chipClass"
        :icon
        dense
        square
      >
        {{ to(priceModel.name) }}
        <q-tooltip v-if="tooltip">{{ tooltip }}</q-tooltip>
      </q-chip>

      <!-- An offer the organization hasn't accepted, on the same line. -->
      <template v-if="pendingOffer">
        <q-icon
          name="arrow_forward"
          size="16px"
          class="text-on-surface-variant"
        />
        <q-chip
          :class="{ 'price-model--due': due }"
          :icon="due ? 'block' : 'schedule'"
          class="price-model--offered"
          dense
          square
        >
          {{ to(pendingOffer.priceModel.name) }}
          <span class="price-model__date">{{ date }}</span>
          <q-tooltip>
            {{ due ? t('dueHint', { date }) : t('pendingHint', { date }) }}
          </q-tooltip>
        </q-chip>
      </template>
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

const due = computed(
  () =>
    pendingOffer !== null && new Date(pendingOffer.effectiveAt) <= new Date(),
);
const date = computed(() =>
  pendingOffer ? d(new Date(pendingOffer.effectiveAt), 'short') : '',
);

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
.price-model-cell {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;

  .q-chip {
    margin: 0;
  }
}

// Not agreed yet: tonal like the status chips, red once it blocks events.
.price-model--offered {
  background: var(--md3-warning-container);
  color: var(--md3-on-warning-container);

  &.price-model--due {
    background: var(--md3-error-container);
    color: var(--md3-on-error-container);
  }
}

.price-model__date {
  margin-left: 6px;
  opacity: 0.8;
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
pendingHint: "Offered, not accepted yet. From {date}, the organization can't create events until it accepts."
dueHint: "Not accepted. Since {date}, the organization can't create events until it accepts."
override: "Differs from the organization's current price model"
default: 'Default price model'
</i18n>

<i18n lang="yaml" locale="de">
pendingHint: 'Angeboten, noch nicht angenommen. Ab dem {date} kann die Organisation keine Veranstaltungen anlegen, bis sie zustimmt.'
dueHint: 'Nicht angenommen. Seit dem {date} kann die Organisation keine Veranstaltungen anlegen, bis sie zustimmt.'
override: 'Weicht vom aktuellen Preismodell der Organisation ab'
default: 'Standard-Preismodell'
</i18n>

<i18n lang="yaml" locale="fr">
pendingHint: "Proposé, pas encore accepté. À partir du {date}, l'organisation ne peut plus créer d'événements tant qu'elle n'a pas accepté."
dueHint: "Non accepté. Depuis le {date}, l'organisation ne peut plus créer d'événements tant qu'elle n'a pas accepté."
override: "Diffère du modèle tarifaire actuel de l'organisation"
default: 'Modèle tarifaire par défaut'
</i18n>

<i18n lang="yaml" locale="pl">
pendingHint: 'Zaproponowano, jeszcze nie zaakceptowano. Od {date} organizacja nie może tworzyć wydarzeń, dopóki nie zaakceptuje.'
dueHint: 'Nie zaakceptowano. Od {date} organizacja nie może tworzyć wydarzeń, dopóki nie zaakceptuje.'
override: 'Różni się od obecnego modelu cenowego organizacji'
default: 'Domyślny model cenowy'
</i18n>

<i18n lang="yaml" locale="cs">
pendingHint: 'Nabídnuto, zatím nepřijato. Od {date} nemůže organizace vytvářet akce, dokud nový model nepřijme.'
dueHint: 'Nepřijato. Od {date} nemůže organizace vytvářet akce, dokud nový model nepřijme.'
override: 'Liší se od současného cenového modelu organizace'
default: 'Výchozí cenový model'
</i18n>
