<template>
  <q-item>
    <q-item-section>
      <q-item-label overline>
        {{ props.label }}
      </q-item-label>
      <q-item-label>
        {{ props.value }}
      </q-item-label>
    </q-item-section>
    <slot />
  </q-item>
</template>

<script lang="ts" setup>
const props = defineProps<{
  label: string;
  value: string | number | null | undefined;
}>();
</script>

<style scoped></style>
