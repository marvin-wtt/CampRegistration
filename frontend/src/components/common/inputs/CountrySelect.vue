<template>
  <q-select
    v-model="model"
    :label
    :options="filteredOptions"
    :rules
    :disable
    color="primary"
    emit-value
    map-options
    use-input
    fill-input
    hide-selected
    input-debounce="0"
    hide-bottom-space
    rounded
    outlined
    @filter="onFilter"
  >
    <template #no-option>
      <q-item>
        <q-item-section class="text-grey">
          {{ t('no_results') }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { countryOptions, type CountryOption } from '@/utils/countries';
import type { ValidationRule } from 'quasar';

const { t, locale } = useI18n();

const { label, rules, disable } = defineProps<{
  label: string;
  rules?: ValidationRule[];
  disable?: boolean;
}>();

const model = defineModel<string | undefined>();

const allOptions = computed<CountryOption[]>(() =>
  countryOptions(locale.value),
);
const needle = ref('');

const filteredOptions = computed<CountryOption[]>(() => {
  if (!needle.value) {
    return allOptions.value;
  }

  return allOptions.value.filter((option) =>
    option.label.toLowerCase().includes(needle.value),
  );
});

function onFilter(search: string, update: (fn: () => void) => void) {
  update(() => {
    needle.value = search.toLowerCase().trim();
  });
}
</script>

<i18n lang="yaml" locale="en">
no_results: 'No matching country'
</i18n>

<i18n lang="yaml" locale="de">
no_results: 'Kein passendes Land'
</i18n>

<i18n lang="yaml" locale="fr">
no_results: 'Aucun pays correspondant'
</i18n>

<i18n lang="yaml" locale="pl">
no_results: 'Brak pasującego kraju'
</i18n>

<i18n lang="yaml" locale="cs">
no_results: 'Žádná odpovídající země'
</i18n>
