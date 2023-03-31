<template>
  <q-select
    v-model="modelValue"
    :options="options"
    v-bind="$attrs"
    :option-value="optionValue"
    emit-value
    map-options
    :multiple="multiple"
  >
    <template
      v-if="!multiple"
      v-slot:selected-item="scope"
    >
      <country-icon
        class="q-px-xs"
        :locale="scope.opt.country"
        size="sm"
      />
    </template>

    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section avatar>
          <country-icon :locale="scope.opt.locale" />
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
      v-for="(data, name, index) in $slots"
      :key="index"
      v-slot:[name]
    >
      <slot
        :name="name"
        v-bind="data"
      ></slot>
    </template>
  </q-select>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import CountryIcon from 'components/localization/CountryIcon.vue';
import { useI18n } from 'vue-i18n';

interface Props {
  modelValue?: string | number | Record<string, string | number>;
  countries?: string[];
  nativeNames?: boolean;
  emitCountry?: boolean;
  emitIsoName?: boolean;
  multiple?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  nativeNames: false,
  emitCountry: false,
  emitIsoName: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void;
}>();

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const { t } = useI18n();

const optionValue = computed<string>(() => {
  return props.emitCountry
    ? 'country'
    : props.emitIsoName
    ? 'isoName'
    : 'locale';
});

const options = computed(() => {
  const countries = props.countries;
  if (countries === undefined) {
    return langOptions.value;
  }

  return langOptions.value.filter((value) => {
    return countries.includes(value.country);
  });
});

const langOptions = computed(() => [
  {
    label: props.nativeNames ? 'Deutsch' : t('countries.de'),
    locale: 'de-DE',
    country: 'de',
    isoName: 'de',
  },
  {
    label: props.nativeNames ? 'Français' : t('countries.fr'),
    locale: 'fr-FR',
    country: 'fr',
    isoName: 'fr',
  },
  {
    label: props.nativeNames ? 'English (US)' : t('countries.us'),
    locale: 'en-US',
    country: 'us',
    isoName: 'en-US',
  },
  {
    label: props.nativeNames ? 'Polski' : t('countries.pl'),
    locale: 'pl-PL',
    country: 'pl',
    isoName: 'pl',
  },
]);
</script>

<i18n lang="yaml" locale="en">
countries:
  de: 'Germany'
  fr: 'France'
  us: 'USA'
  pl: 'Poland'
</i18n>

<i18n lang="yaml" locale="de">
countries:
  de: 'Deutschland'
  fr: 'Frankreich'
  us: 'USA'
  pl: 'Polen'
</i18n>

<i18n lang="yaml" locale="fr">
countries:
  de: 'Allemagne'
  fr: 'France'
  us: 'USA'
  pl: 'Pologne'
</i18n>

<i18n lang="yaml" locale="pl">
countries:
  de: 'Niemcy'
  fr: 'Francja'
  us: 'USA'
  pl: 'Polska'
</i18n>
