<template>
  <div>
    <div class="text-caption text-grey-7 q-mb-sm">
      {{ label }}
    </div>
    <div class="row items-center justify-around q-gutter-xs no-wrap">
      <button
        v-for="color in PRESET_COLORS"
        :key="color"
        type="button"
        class="color-swatch"
        :style="{ background: color }"
        :class="{ 'color-swatch--active': model === color }"
        @click="model = color"
      >
        <q-icon
          v-if="model === color"
          name="check"
          size="12px"
          color="white"
        />
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
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const PRESET_COLORS = [
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#3F51B5',
  '#2196F3',
  '#00BCD4',
  '#009688',
  '#4CAF50',
  '#FF9800',
  '#795548',
  '#607D8B',
  '#212121',
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

  return !(PRESET_COLORS as readonly string[]).includes(model.value);
});
</script>

<style lang="scss" scoped>
.color-swatch {
  width: 22px;
  height: 22px;
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
  flex-shrink: 0;

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
