<template>
  <q-select
    v-bind="props"
    v-model="model"
    :options
    emit-value
    map-options
    rounded
  >
    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section avatar>
          <country-icon :country="scope.opt.value" />
        </q-item-section>
        <q-item-section>
          <q-item-label>
            {{ scope.opt.label }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>

    <!-- Parent slots -->
    <template
      v-for="(data, name, index) in slots"
      :key="index"
      #[name]
    >
      <!-- TODO This should be a issue with vue tsc -->
      <!-- @vue-ignore -->
      <slot
        :name="name"
        v-bind="data"
      />
    </template>
  </q-select>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import CountryIcon from '@/components/common/localization/CountryIcon.vue';
import { useI18n } from 'vue-i18n';
import { type QSelectOption, type QSelectSlots } from 'quasar';

const { t } = useI18n();

type ModelValue = undefined | string | string[];

const model = defineModel<ModelValue>();
const slots = defineSlots<QSelectSlots>();

const props = defineProps<{
  countries: string[];
}>();

const options = computed(() => {
  const countries = props.countries;
  if (countries === undefined) {
    return langOptions.value;
  }

  return langOptions.value.filter((option) => {
    return countries.includes(option.value);
  });
});

const langOptions = computed<QSelectOption[]>(() => [
  {
    label: t('country.de'),
    value: 'de',
  },
  {
    label: t('country.fr'),
    value: 'fr',
  },
  {
    label: t('country.gb'),
    value: 'gb',
  },
  {
    label: t('country.us'),
    value: 'us',
  },
  {
    label: t('country.pl'),
    value: 'pl',
  },
  {
    label: t('country.cz'),
    value: 'cz',
  },
]);

// NOTE: Translations are stored in global translations
</script>

<style scoped>
/* Quasar renders the selected value(s) as a single `.ellipsis` span, which is
   `white-space: nowrap`. With several long localised country names that span's
   min-content forces the field — and any flex/grid container it sits in — wider
   than the viewport on narrow screens. Let the selection wrap instead; the
   field is auto-height, so it simply grows taller. */
:deep(.q-field__native > span) {
  white-space: normal;
}
</style>
