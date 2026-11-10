<template>
  <div class="text-warning">
    <div
      v-for="(message, index) in messages"
      :key="index"
      :data-test="dataTest"
    >
      <q-icon name="warning" />
      {{ message }}
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  messages: string[];
  dataTest: string;
}>();
</script>
