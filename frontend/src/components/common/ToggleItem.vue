<template>
  <q-item
    v-ripple
    tag="label"
  >
    <q-item-section>
      <q-item-label>{{ props.label }}</q-item-label>
      <q-item-label caption>{{ props.hint }}</q-item-label>
    </q-item-section>
    <q-item-section avatar>
      <q-toggle
        v-model="modelValue"
        :color="props.color"
      />
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
interface Props {
  label: string;
  hint?: string;
  color?: string;
}

const props = defineProps<Props>();

const modelValue = defineModel<boolean | undefined>();
</script>
