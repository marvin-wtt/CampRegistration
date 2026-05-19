<template>
  <q-field
    :model-value="model"
    :label="label"
    outlined
    rounded
    readonly
    class="cursor-pointer"
  >
    <template #control>
      <div class="row items-center q-gutter-xs no-wrap">
        <div
          class="color-dot"
          :style="{ background: model ?? '#ffffff' }"
        />
        <span class="text-body2">{{ colorLabel }}</span>
      </div>
    </template>

    <q-menu
      anchor="bottom left"
      self="top left"
      :offset="[0, 4]"
    >
      <div class="color-grid q-pa-sm">
        <button
          v-for="preset in PRESET_COLORS"
          :key="preset.color"
          v-close-popup
          type="button"
          class="color-swatch"
          :style="{ background: preset.color }"
          :class="{ 'color-swatch--active': model === preset.color }"
          @click="model = preset.color"
        >
          <q-icon
            v-if="model === preset.color"
            name="check"
            size="12px"
            color="white"
          />
          <q-tooltip>{{ t(preset.key) }}</q-tooltip>
        </button>

        <button
          type="button"
          class="color-swatch color-swatch--custom"
          :style="isCustom ? { background: model ?? '#ffffff' } : {}"
          :class="{ 'color-swatch--active': isCustom }"
        >
          <q-icon
            v-if="!isCustom"
            name="colorize"
            size="12px"
            color="grey-6"
          />
          <q-icon
            v-else
            name="check"
            size="12px"
            color="white"
          />
          <q-popup-proxy
            cover
            transition-show="scale"
            transition-hide="scale"
          >
            <q-color v-model="model" />
          </q-popup-proxy>
        </button>
      </div>
    </q-menu>
  </q-field>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const PRESET_COLORS = [
  { color: '#F44336', key: 'red' },
  { color: '#E91E63', key: 'pink' },
  { color: '#9C27B0', key: 'purple' },
  { color: '#3F51B5', key: 'indigo' },
  { color: '#2196F3', key: 'blue' },
  { color: '#00BCD4', key: 'cyan' },
  { color: '#009688', key: 'teal' },
  { color: '#4CAF50', key: 'green' },
  { color: '#FF9800', key: 'orange' },
  { color: '#795548', key: 'brown' },
  { color: '#607D8B', key: 'blueGrey' },
  { color: '#212121', key: 'dark' },
] as const;

const model = defineModel<string | null | undefined>({
  default: '#0000ff',
  required: false,
});

const { label } = defineProps<{
  label?: string;
}>();

const isCustom = computed(() => {
  if (!model.value) {
    return false;
  }

  return !PRESET_COLORS.some((p) => p.color === model.value);
});

const colorLabel = computed(() => {
  const preset = PRESET_COLORS.find((p) => p.color === model.value);
  if (preset) {
    return t(preset.key);
  }

  return model.value ?? '';
});
</script>

<style lang="scss" scoped>
.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  justify-items: center;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    transform: scale(1.15);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  }

  &--active {
    border-color: rgba(0, 0, 0, 0.35);
    box-shadow: 0 0 0 2px white inset;
    transform: scale(1.1);
  }

  &--custom {
    background: $grey-3;
    border-color: $grey-4;
  }
}
</style>

<i18n lang="yaml" locale="en">
red: 'Red'
pink: 'Pink'
purple: 'Purple'
indigo: 'Indigo'
blue: 'Blue'
cyan: 'Cyan'
teal: 'Teal'
green: 'Green'
orange: 'Orange'
brown: 'Brown'
blueGrey: 'Blue Grey'
dark: 'Dark'
</i18n>

<i18n lang="yaml" locale="de">
red: 'Rot'
pink: 'Rosa'
purple: 'Lila'
indigo: 'Indigo'
blue: 'Blau'
cyan: 'Cyan'
teal: 'Blaugrün'
green: 'Grün'
orange: 'Orange'
brown: 'Braun'
blueGrey: 'Blaugrau'
dark: 'Dunkel'
</i18n>

<i18n lang="yaml" locale="fr">
red: 'Rouge'
pink: 'Rose'
purple: 'Violet'
indigo: 'Indigo'
blue: 'Bleu'
cyan: 'Cyan'
teal: 'Sarcelle'
green: 'Vert'
orange: 'Orange'
brown: 'Marron'
blueGrey: 'Gris-bleu'
dark: 'Sombre'
</i18n>

<i18n lang="yaml" locale="pl">
red: 'Czerwony'
pink: 'Różowy'
purple: 'Fioletowy'
indigo: 'Indygo'
blue: 'Niebieski'
cyan: 'Cyjan'
teal: 'Morski'
green: 'Zielony'
orange: 'Pomarańczowy'
brown: 'Brązowy'
blueGrey: 'Niebieskoszary'
dark: 'Ciemny'
</i18n>

<i18n lang="yaml" locale="cs">
red: 'Červená'
pink: 'Růžová'
purple: 'Fialová'
indigo: 'Indigo'
blue: 'Modrá'
cyan: 'Azurová'
teal: 'Tyrkysová'
green: 'Zelená'
orange: 'Oranžová'
brown: 'Hnědá'
blueGrey: 'Modro-šedá'
dark: 'Tmavá'
</i18n>
