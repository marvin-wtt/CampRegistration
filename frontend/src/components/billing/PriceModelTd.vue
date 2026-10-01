<template>
  <q-td :props>
    <template v-if="priceModel === null">
      <span class="text-on-surface-variant">{{ t('inherited') }}</span>
    </template>
    <template v-else>
      <q-chip
        :class="chipClass"
        :icon="scope === 'event' ? 'sell' : undefined"
        dense
        square
      >
        {{ to(priceModel.name) }}
        <q-tooltip v-if="scope === 'event'">{{ t('override') }}</q-tooltip>
      </q-chip>
      <q-badge
        v-if="priceModel.isDefault"
        :label="t('default')"
        color="primary"
        outline
      />
    </template>
  </q-td>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PriceModelSummary } from '@camp-registration/common/entities';
import type { QTableBodyCellProps } from '@/types/quasar/QTableBodyCellProps';
import { useObjectTranslation } from '@/composables/objectTranslation';

const { props, priceModel, scope } = defineProps<{
  props: QTableBodyCellProps<unknown>;
  /** `null` on an event: no override, the organization's model applies. */
  priceModel: PriceModelSummary | null;
  scope: 'organization' | 'event';
}>();

const { t } = useI18n();
const { to } = useObjectTranslation();

// An organization on the default model is the normal case and stays quiet;
// anything else — a deliberate choice for it or its event — stands out.
const chipClass = computed(() =>
  priceModel?.isDefault ? 'price-model--default' : 'price-model--custom',
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
inherited: "Organization's"
override: "Overrides the organization's price model"
default: 'Default'
</i18n>

<i18n lang="yaml" locale="de">
inherited: 'Der Organisation'
override: 'Ersetzt das Preismodell der Organisation'
default: 'Standard'
</i18n>

<i18n lang="yaml" locale="fr">
inherited: "Celui de l'organisation"
override: "Remplace le modèle tarifaire de l'organisation"
default: 'Par défaut'
</i18n>

<i18n lang="yaml" locale="pl">
inherited: 'Organizacji'
override: 'Zastępuje model cenowy organizacji'
default: 'Domyślny'
</i18n>

<i18n lang="yaml" locale="cs">
inherited: 'Organizace'
override: 'Nahrazuje cenový model organizace'
default: 'Výchozí'
</i18n>
