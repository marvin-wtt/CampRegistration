<template>
  <div class="row">
    <div class="col">
      <!-- Single input -->
      <q-input
        v-if="!useTranslations || !enabled"
        class="col"
        v-model="value"
        :label="label"
        :modelModifiers="props.modelModifiers"
        v-bind="$attrs"
      >
        <template
          v-for="(data, name, index) in $slots"
          :key="index"
          v-slot:[name]
        >
          <slot
            :name="name"
            v-bind="data"
          />
        </template>
      </q-input>

      <!-- Translated input -->
      <q-input
        v-else
        v-for="(locale, index) in props.locales"
        :key="index"
        v-model="translations[locale]"
        :label="`${label} (${locale})`"
        :modelModifiers="props.modelModifiers"
        clearable
        v-bind="$attrs"
        @clear="clearTranslation(locale)"
      >
        <template v-slot:prepend>
          <country-icon :locale="locale" />
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
          />
        </template>
      </q-input>
    </div>

    <!-- Actions -->
    <div
      v-if="enabled && !always"
      class="col-shrink column justify-center q-pl-sm"
    >
      <q-btn
        :icon="useTranslations ? 'unfold_less' : 'translate'"
        round
        outline
        @click="useTranslations = !useTranslations"
      >
        <q-tooltip>
          {{ useTranslations ? t('actions.disable') : t('actions.enable') }}
        </q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script lang="ts" setup>
import CountryIcon from 'components/localization/CountryIcon.vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type Translations = Record<string, string | number>;

const { t } = useI18n();

interface Props {
  modelValue?: string | number | Translations;
  modelModifiers?: Record<string, boolean>;
  label?: string;
  locales?: string[];
  always?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  always: false,
});
const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void;
}>();

const useTranslations = ref(defaultUseTranslations());
const value = ref<string | number>(defaultValue());
const translations = ref<Translations>(defaultTranslations());

const label = computed<string>(() => {
  return props.label ?? '';
});

const enabled = computed<boolean>(() => {
  return props.locales !== undefined && props.locales.length > 1;
});

function defaultUseTranslations(): boolean {
  return props.modelValue === undefined || typeof props.modelValue === 'object';
}

function defaultValue(): string | number {
  return typeof props.modelValue === 'string' ||
    typeof props.modelValue === 'number'
    ? props.modelValue
    : '';
}

function defaultTranslations(): Translations {
  return typeof props.modelValue === 'object' ? props.modelValue : {};
}

watch(
  [translations, value, useTranslations],
  () => {
    const v = useTranslations.value ? translations.value : value.value;
    emit('update:modelValue', v);
  },
  { deep: true }
);

function clearTranslation(locale: string) {
  if (locale in translations.value) {
    delete translations.value[locale];
  }
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (typeof newValue === 'string' || typeof newValue === 'number') {
      value.value = newValue;
      useTranslations.value = false;
    } else if (typeof newValue === 'object') {
      translations.value = newValue;
      useTranslations.value = true;
    }
  }
);
</script>

<style scoped>
.margin-between > * + * {
  margin-top: 0.5rem;
}
</style>

<i18n lang="yaml" locale="en">
actions:
  enable: 'Use translations'
  disable: "Don't use translations"
</i18n>

<i18n lang="yaml" locale="de">
actions:
  enable: 'Übersetzungen verwenden'
  disable: 'Keine Übersetzungen verwenden'
</i18n>

<i18n lang="yaml" locale="fr">
actions:
  enable: 'Utiliser les traductions'
  disable: 'Ne pas utiliser les traductions'
</i18n>
