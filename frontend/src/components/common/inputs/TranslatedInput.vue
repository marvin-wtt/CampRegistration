<template>
  <div class="row">
    <div
      class="col"
      style="display: grid"
    >
      <transition name="bounce">
        <!-- Single input -->
        <div
          v-if="!useTranslations || !enabled"
          class="layer1"
        >
          <q-input
            v-model="value"
            :label="label"
            :model-modifiers="modifiers"
            v-bind="attrs"
          >
            <template
              v-for="(data, name, index) in slots"
              :key="index"
              #[name]
            >
              <slot
                :name="name"
                v-bind="data"
              />
            </template>
          </q-input>
        </div>

        <!-- Translated input -->
        <div
          v-else
          class="layer2"
        >
          <template v-if="modifiers.number">
            <!-- Numeric inputs -->
            <q-input
              v-for="(locale, index) in props.locales"
              :key="index"
              v-model.number="translations[locale]"
              :label="`${label} (${locale})`"
              clearable
              v-bind="attrs"
              @clear="clearTranslation(locale)"
            >
              <template #prepend>
                <country-icon :locale="locale" />
              </template>

              <!-- Parent slots -->
              <template
                v-for="(data, name, slotIndex) in slots"
                :key="slotIndex"
                #[name]
              >
                <slot
                  :name="name"
                  v-bind="data"
                />
              </template>
            </q-input>
          </template>
          <!-- Other inputs -->
          <template v-else>
            <q-input
              v-for="(locale, index) in props.locales"
              :key="index"
              v-model="translations[locale]"
              :label="`${label} (${locale})`"
              clearable
              v-bind="attrs"
              @clear="clearTranslation(locale)"
            >
              <template #prepend>
                <country-icon :locale="locale" />
              </template>

              <!-- Parent slots -->
              <template
                v-for="(data, name, slotIndex) in slots"
                :key="slotIndex"
                #[name]
              >
                <slot
                  :name="name"
                  v-bind="data"
                />
              </template>
            </q-input>
          </template>
        </div>
      </transition>
    </div>

    <!-- Actions -->
    <div
      v-if="enabled && !always"
      class="col-shrink column justify-center q-pl-sm"
    >
      <translation-toggle-btn v-model="useTranslations" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import CountryIcon from 'components/common/localization/CountryIcon.vue';
import { computed, ref, useAttrs, watch } from 'vue';
import { type QInputSlots } from 'quasar';
import TranslationToggleBtn from 'components/common/inputs/TranslationToggleBtn.vue';

type Translations = Record<string, string | number>;
type ModelValueType = undefined | string | number | Translations;

const [model, modifiers] = defineModel<ModelValueType>();
const attrs = useAttrs();
const slots = defineSlots<QInputSlots>();

interface Props {
  label?: string;
  locales?: string[];
  always?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  locales: () => [],
  always: false,
});

const useTranslations = ref(defaultUseTranslations());
const value = ref<string | number>(defaultValue());
const translations = ref<Translations>(defaultTranslations());

const enabled = computed<boolean>(() => {
  return props.locales.length > 1;
});

function defaultUseTranslations(): boolean {
  return model.value === undefined || typeof model.value === 'object';
}

function defaultValue(): string | number {
  // If the model value if an object and there is only one locale, we assume that the object is a translation and
  //  contains a translation for the given locale
  if (props.locales.length === 1 && typeof model.value === 'object') {
    return model.value[props.locales[0]];
  }

  return typeof model.value === 'string' || typeof model.value === 'number'
    ? model.value
    : '';
}

function defaultTranslations(): Translations {
  return typeof model.value === 'object' ? model.value : {};
}

const lastEmittedValue = ref<ModelValueType>();
watch(
  [translations, value, useTranslations],
  () => {
    const v =
      useTranslations.value && enabled.value ? translations.value : value.value;

    if (v !== lastEmittedValue.value) {
      lastEmittedValue.value = v;

      model.value = v;
    }
  },
  { deep: true },
);

function clearTranslation(locale: string) {
  if (locale in translations.value) {
    delete translations.value[locale];
  }
}

watch(
  () => model.value,
  (newValue) => {
    if (typeof newValue === 'string' || typeof newValue === 'number') {
      value.value = newValue;
      useTranslations.value = false;
    } else if (typeof newValue === 'object') {
      translations.value = newValue;
      useTranslations.value = true;
    }
  },
);
</script>

<style scoped>
.margin-between > * + * {
  margin-top: 0.5rem;
}

.layer1,
.layer2 {
  grid-column: 1;
  grid-row: 1;
}

.bounce-enter-active {
  animation: bounce-in 0.5s;
}

.bounce-leave-active {
  animation: bounce-in 0.5s reverse;
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}
</style>
