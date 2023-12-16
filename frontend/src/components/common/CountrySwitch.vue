<template>
  <q-select
    v-model="value"
    :options="options"
    v-bind="$attrs"
    :option-value="optionValue"
    emit-value
    map-options
    :multiple="multiple"
    rounded
  >
    <template
      v-if="!multiple"
      #selected-item="scope"
    >
      <country-icon
        v-if="'country' in scope.opt"
        class="q-px-xs"
        :locale="scope.opt.country"
        size="sm"
      />

      <a v-else>
        {{ scope.opt }}
      </a>
    </template>

    <template #option="scope">
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
      #[name]
    >
      <slot
        :name="name"
        v-bind="data"
      />
    </template>
  </q-select>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import CountryIcon from 'components/common/localization/CountryIcon.vue';
import { useI18n } from 'vue-i18n';

interface Props {
  modelValue:
    | undefined
    | string
    | string[]
    | number
    | Record<string, string | number>;
  countries?: string[];
  nativeNames?: boolean;
  emitCountry?: boolean;
  emitIsoName?: boolean;
  multiple?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  countries: undefined, // TODO Why cant it be an empty array?
  nativeNames: false,
  emitCountry: false,
  emitIsoName: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void;
}>();

const value = computed({
  get: () => validModelValue.value,
  set: (value) => emit('update:modelValue', value),
});

const validModelValue = computed(() => {
  // Map locale to short locale if defined locale does not exist
  if (optionValue.value !== 'locale') {
    return props.modelValue;
  }

  const locale = props.modelValue;
  if (typeof locale !== 'string') {
    return props.modelValue;
  }

  if (langOptions.value.some((value) => value.locale === locale)) {
    return locale;
  }

  const shortLocale = locale.split(/[-_]/)[0];
  return langOptions.value.some((value) => value.locale === shortLocale)
    ? shortLocale
    : props.modelValue;
});

const { t } = useI18n();

type Options = 'country' | 'isoName' | 'locale';

const optionValue = computed<Options>(() => {
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

// Always use short locale if no other is defined for that language
const langOptions = computed(() => [
  {
    label: props.nativeNames ? 'Deutsch' : t('countries.de'),
    locale: 'de', // 'de-DE'
    country: 'de',
    isoName: 'de',
  },
  {
    label: props.nativeNames ? 'Français' : t('countries.fr'),
    locale: 'fr', // 'fr-FR'
    country: 'fr',
    isoName: 'fr',
  },
  {
    label: props.nativeNames ? 'English (US)' : t('countries.us'),
    locale: 'en', // 'en-US'
    country: 'us',
    isoName: 'en-US',
  },
  // {
  //   label: props.nativeNames ? 'Polski' : t('countries.pl'),
  //   locale: 'pl', // 'pl-PL'
  //   countryQuestion: 'pl',
  //   isoName: 'pl',
  // },
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
