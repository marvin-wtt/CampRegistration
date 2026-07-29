<template>
  <q-select
    v-model="model"
    v-bind="selectProps"
    :options
    emit-value
    map-options
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
      v-for="(_, name) in slots"
      :key="name"
      #[name]
    >
      <slot :name />
    </template>
  </q-select>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import CountryIcon from '@/components/common/localization/CountryIcon.vue';
import { useI18n } from 'vue-i18n';
import { type QSelectOption, type QSelectProps } from 'quasar';
import {
  type ForwardedFieldSlots,
  usePassthroughProps,
} from '@/composables/passthroughProps';

const { t } = useI18n();

type ModelValue = undefined | string | string[];

interface Props extends Omit<
  QSelectProps,
  'modelValue' | 'onUpdate:modelValue' | 'options' | 'emitValue' | 'mapOptions'
> {
  countries: string[];
}

const model = defineModel<ModelValue>();
const slots = defineSlots<ForwardedFieldSlots>();

const props = withDefaults(defineProps<Props>(), {
  rounded: true,
});

const selectProps = usePassthroughProps(props, ['countries']);

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
