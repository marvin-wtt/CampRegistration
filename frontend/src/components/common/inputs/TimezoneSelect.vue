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
import { timezoneOptions, type TimezoneOption } from '@/utils/timezones';
import type { ValidationRule } from 'quasar';

const { t } = useI18n();

const { label, rules, disable } = defineProps<{
  label: string;
  rules?: ValidationRule[];
  disable?: boolean;
}>();

const model = defineModel<string | undefined>();

const allOptions = computed<TimezoneOption[]>(() => timezoneOptions());
const needle = ref('');

const filteredOptions = computed<TimezoneOption[]>(() => {
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
no_results: 'No matching timezone'
</i18n>

<i18n lang="yaml" locale="de">
no_results: 'Keine passende Zeitzone'
</i18n>

<i18n lang="yaml" locale="fr">
no_results: 'Aucun fuseau horaire correspondant'
</i18n>

<i18n lang="yaml" locale="pl">
no_results: 'Brak pasującej strefy czasowej'
</i18n>

<i18n lang="yaml" locale="cs">
no_results: 'Žádné odpovídající časové pásmo'
</i18n>
