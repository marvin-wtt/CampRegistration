<template>
  <q-btn
    :label
    :icon
    color="grey"
    flat
    dense
    rounded
    class="full-width"
    @click="toggle"
  />

  <q-slide-transition>
    <div
      v-show="model"
      class="q-gutter-y-sm column no-wrap"
    >
      <slot />
    </div>
  </q-slide-transition>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const model = defineModel<boolean>({
  default: false,
  required: false,
});

const { expandLabel, contractLabel } = defineProps<{
  expandLabel: string;
  contractLabel: string;
}>();

const label = computed<string>(() => {
  return model.value ? contractLabel : expandLabel;
});

const icon = computed<string>(() => {
  return model.value ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
});

function toggle() {
  model.value = !model.value;
}
</script>

<style scoped></style>
