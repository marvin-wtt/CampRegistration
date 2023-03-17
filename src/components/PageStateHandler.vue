<template>
  <q-page class="row full-width justify-center">
    <div
      v-if="loading"
      class="self-center"
    >
      <q-spinner
        color="primary"
        size="100px"
      />
    </div>

    <div
      v-else-if="error !== null"
      class="text-center self-center"
    >
      <q-icon
        name="error"
        size="xl"
      />

      <p class="text-h4">
        {{ error }}
      </p>
    </div>

    <slot v-else />
  </q-page>
</template>

<script lang="ts" setup>
interface Props {
  error?: unknown;
  loading?: boolean;
}

defineProps<Props>();
</script>

<style scoped></style>
