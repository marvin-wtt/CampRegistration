<template>
  <div class="row">
    <div
      class="col"
      style="display: grid"
    >
      <transition name="translation-fade">
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
          class="layer2 row no-wrap items-stretch"
        >
          <!-- Field icon rendered once for the whole locale group -->
          <div
            v-if="$slots.before"
            class="column justify-center translation-before"
          >
            <slot name="before" />
          </div>

          <div class="translation-group column col">
            <template v-if="modifiers.number">
              <!-- Numeric inputs -->
              <q-input
                v-for="(locale, index) in locales"
                :key="index"
                v-model.number="translations[locale]"
                :label="label"
                clearable
                v-bind="attrs"
                @clear="clearTranslation(locale)"
              >
                <template #prepend>
                  <div class="locale-marker row items-center no-wrap">
                    <country-icon :locale="locale" />
                    <span class="locale-code">
                      {{ locale.toUpperCase() }}
                    </span>
                    <q-tooltip>
                      {{ localeName(locale) }}
                    </q-tooltip>
                  </div>
                </template>

                <!-- Parent slots (locale flag replaces the field icon here) -->
                <template
                  v-for="(data, name, slotIndex) in translatedSlots"
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
                v-for="(locale, index) in locales"
                :key="index"
                v-model="translations[locale]"
                :label="label"
                clearable
                v-bind="attrs"
                @clear="clearTranslation(locale)"
              >
                <template #prepend>
                  <div class="locale-marker row items-center no-wrap">
                    <country-icon :locale="locale" />
                    <span class="locale-code">{{ locale.toUpperCase() }}</span>
                    <q-tooltip>{{ localeName(locale) }}</q-tooltip>
                  </div>
                </template>

                <!-- Parent slots (locale flag replaces the field icon here) -->
                <template
                  v-for="(data, name, slotIndex) in translatedSlots"
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
        </div>
      </transition>
    </div>

    <!-- Actions -->
    <div
      v-if="enabled && !always"
      class="col-shrink column actions q-pl-sm"
    >
      <translation-toggle-btn v-model="useTranslations" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import CountryIcon from '@/components/common/localization/CountryIcon.vue';
import { computed, ref, useAttrs, watch } from 'vue';
import { type QInputSlots } from 'quasar';
import TranslationToggleBtn from '@/components/common/inputs/TranslationToggleBtn.vue';
import { useI18n } from 'vue-i18n';

type Translations = Record<string, string | number>;
type ModelValueType = undefined | null | string | number | Translations;

// eslint-disable-next-line @typescript-eslint/unbound-method
const { locale, t, te } = useI18n();
const attrs = useAttrs();

const [model, modifiers] = defineModel<ModelValueType>();
const slots = defineSlots<QInputSlots>();

const {
  label = '',
  locales = [],
  always = false,
  defaultUntranslated = false,
} = defineProps<{
  label?: string;
  locales?: string[];
  always?: boolean;
  defaultUntranslated?: boolean;
}>();

const useTranslations = ref(defaultUseTranslations());
const value = ref<string | number>(defaultValue());
const translations = ref<Translations>(defaultTranslations());

const enabled = computed<boolean>(() => {
  return locales.length > 1;
});

// In translated mode the per-locale flag stands in for the field icon, so the
// parent's `before` slot is dropped to avoid doubling up glyphs on every row.
const translatedSlots = computed<Partial<QInputSlots>>(() => {
  const rest: Partial<QInputSlots> = { ...slots };
  delete rest.before;
  return rest;
});

// Localized country/language name for the locale marker tooltip; falls back to
// the uppercased code when no global `country.*` key exists for the value.
function localeName(value: string): string {
  const key = `country.${value.toLowerCase()}`;
  return te(key) ? t(key) : value.toUpperCase();
}

function defaultUseTranslations(): boolean {
  if (model.value == null) {
    return !defaultUntranslated;
  }

  return typeof model.value === 'object';
}

function defaultValue(): string | number {
  // If the model value if an object and there is only one locale, we assume that the object is a translation and
  //  contains a translation for the given locale
  if (
    locales.length === 1 &&
    model.value !== null &&
    typeof model.value === 'object'
  ) {
    const locale = locales[0]!;

    if (!(locale in model.value)) {
      return Object.values(model.value)[0] ?? '';
    }

    return model.value[locale] ?? '';
  }

  return typeof model.value === 'string' || typeof model.value === 'number'
    ? model.value
    : '';
}

function defaultTranslations(): Translations {
  return typeof model.value === 'object' && model.value ? model.value : {};
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

watch(useTranslations, (enabled, wasEnabled) => {
  if (!enabled || wasEnabled || value.value === '' || value.value === 0) {
    return;
  }

  const userLocale = locale.value.split('-')[0]!;
  const matchedLocale = locales.find((l) => l === userLocale);
  if (matchedLocale && !(matchedLocale in translations.value)) {
    translations.value[matchedLocale] = value.value;
  }
});

watch(
  () => model.value,
  (newValue) => {
    if (typeof newValue === 'string' || typeof newValue === 'number') {
      value.value = newValue;
      useTranslations.value = false;
    } else if (typeof newValue === 'object' && newValue !== null) {
      translations.value = newValue;
      useTranslations.value = true;
    } else {
      value.value = '';
      translations.value = {};
    }
  },
);
</script>

<style scoped>
.layer1,
.layer2 {
  grid-column: 1;
  grid-row: 1;
}

/* Group the per-locale fields into one unit with a subtle MD3 outline rule. */
.translation-group {
  gap: 8px;
  padding-left: 12px;
  border-left: 2px solid var(--md3-outline-variant);
}

/* The field icon sits once to the left of the whole locale group. Match
   Quasar's field marginal font-size so the icon isn't shrunk to base text size
   once rendered outside the q-field context. */
.translation-before {
  padding-right: 12px;
  font-size: 24px;
  color: var(--md3-on-surface-variant);
}

/* Per-locale marker: flag + uppercase code, with the full name in a tooltip. */
.locale-marker {
  gap: 6px;
  cursor: default;
}

.locale-code {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--md3-on-surface-variant);
}

/* Center the toggle against the whole group, matching the field icon on the
   left — it governs all locales, so it reads as a group-level control. */
.actions {
  justify-content: center;
}

/* MD3 fade-through: the outgoing layer fades out quickly while the incoming
   layer fades in and lifts. Both layers share one grid cell, so they
   cross-fade without absolute positioning. */
.translation-fade-enter-active {
  transition:
    opacity 0.21s cubic-bezier(0.2, 0, 0, 1),
    transform 0.21s cubic-bezier(0.2, 0, 0, 1);
  transition-delay: 0.09s;
}

.translation-fade-leave-active {
  transition: opacity 0.09s cubic-bezier(0.3, 0, 1, 1);
}

.translation-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.translation-fade-leave-to {
  opacity: 0;
}
</style>
