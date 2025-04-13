<template>
  <q-btn-dropdown
    ref="token"
    :icon="props.icon"
    :label="props.label"
    :style="{ color: value }"
    size="sm"
    dense
    flat
    menu-anchor="bottom left"
    menu-self="top left"
    @click="pickerVisible = true"
  >
    <q-color
      v-model="value"
      @change="change"
    />
  </q-btn-dropdown>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { QBtnDropdown, QColor } from 'quasar';

const pickerVisible = ref<boolean>(true);
const token = ref<QBtnDropdown | null>(null);

const props = withDefaults(
  defineProps<{
    icon?: string;
    label?: string;
    color?: string;
  }>(),
  {
    icon: 'palette',
    label: undefined,
    color: '#000',
  },
);

const emit = defineEmits<{
  (e: 'change', color: string): void;
}>();

const value = ref<string>(props.color);

function change(color: string) {
  token.value?.hide();

  emit('change', color);
}
</script>

<style scoped></style>
