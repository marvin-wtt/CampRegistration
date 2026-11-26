<template>
  <!-- Any ISO currency, searched by code or name; shows only the code. -->
  <q-select
    v-model="model"
    :options="filtered"
    option-value="value"
    option-label="value"
    emit-value
    map-options
    use-input
    fill-input
    hide-selected
    :input-debounce="0"
    clearable
    dense
    outlined
    rounded
    hide-bottom-space
    @filter="filter"
  >
    <template #option="{ opt, itemProps }">
      <q-item v-bind="itemProps">
        <q-item-section side>
          <span class="text-mono text-weight-medium">{{ opt.value }}</span>
        </q-item-section>
        <q-item-section>{{ opt.name }}</q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { currencyOptions, type CurrencyOption } from '@/utils/currencies';

const { exclude = null } = defineProps<{
  /** Not offered, e.g. the event's own currency. */
  exclude?: string | null;
}>();

const model = defineModel<string | null>({ required: true });

const { locale } = useI18n();

const options = computed(() =>
  currencyOptions(locale.value).filter((o) => o.value !== exclude),
);
const needle = ref('');
const filtered = computed<CurrencyOption[]>(() =>
  needle.value
    ? options.value.filter(
        (o) =>
          o.value.toLowerCase().includes(needle.value) ||
          o.name.toLowerCase().includes(needle.value),
      )
    : options.value,
);

function filter(value: string, update: (fn: () => void) => void) {
  update(() => {
    needle.value = value.trim().toLowerCase();
  });
}
</script>

<style scoped>
.text-mono {
  font-variant-numeric: tabular-nums;
  min-width: 3em;
}
</style>
