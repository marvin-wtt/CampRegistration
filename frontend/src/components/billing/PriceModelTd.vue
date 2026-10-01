<template>
  <q-td :props>
    <q-chip
      :class="chipClass"
      :icon="override ? 'sell' : undefined"
      dense
      square
    >
      {{ to(priceModel.name) }}
      <q-tooltip v-if="override">{{ t('override') }}</q-tooltip>
    </q-chip>
    <q-badge
      v-if="priceModel.isDefault"
      :label="t('default')"
      color="primary"
      outline
    />
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
} = defineProps<{
  props: QTableBodyCellProps<unknown>;
  priceModel: PriceModelSummary;
  /** An event on another model than its organization is on now. */
  override?: boolean;
}>();

const { t } = useI18n();
const { to } = useObjectTranslation();

// The normal case stays quiet: an organization on the default model, an
// event on its organization's. Anything else is a deliberate choice.
const chipClass = computed(() =>
  override || !priceModel.isDefault
    ? 'price-model--custom'
    : 'price-model--default',
);
</script>

<style scoped lang="scss">
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
override: "Differs from the organization's current price model"
default: 'Default'
</i18n>

<i18n lang="yaml" locale="de">
override: 'Weicht vom aktuellen Preismodell der Organisation ab'
default: 'Standard'
</i18n>

<i18n lang="yaml" locale="fr">
override: "Diffère du modèle tarifaire actuel de l'organisation"
default: 'Par défaut'
</i18n>

<i18n lang="yaml" locale="pl">
override: 'Różni się od obecnego modelu cenowego organizacji'
default: 'Domyślny'
</i18n>

<i18n lang="yaml" locale="cs">
override: 'Liší se od současného cenového modelu organizace'
default: 'Výchozí'
</i18n>
