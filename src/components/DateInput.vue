<template>
  <!-- TODO Mask and validate correctly  -->
  <q-input
    v-model="modelValue"
    hide-bottom-space
    mask="date"
    outlined
    rounded
    v-bind="$attrs"
  >
    <template v-slot:append>
      <q-icon
        class="cursor-pointer"
        name="event"
      >
        <q-popup-proxy
          ref="popup"
          cover
          transition-hide="scale"
          transition-show="scale"
        >
          <q-date v-model="modelValue">
            <div class="row items-center justify-end">
              <q-btn
                v-close-popup
                color="primary"
                flat
                label="Ok"
              />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
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
  </q-input>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface Props {
  modelValue?: string | number | Record<string, string | number>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void;
}>();

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>

<style scoped></style>
