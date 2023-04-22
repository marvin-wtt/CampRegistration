<template>
  <q-page
    class="row full-width justify-center"
    :padding="props.padding"
  >
    <div
      v-if="props.loading"
      class="self-center"
    >
      <q-spinner
        color="primary"
        size="100px"
      />
    </div>

    <div
      v-else-if="error"
      class="text-center self-center"
    >
      <q-icon
        name="error"
        size="xl"
      />

      <p class="text-h4">
        {{ props.error || 'Error' }}
      </p>
    </div>

    <slot v-else />
  </q-page>
</template>

<script lang="ts" setup>
import { computed, onErrorCaptured, ref } from 'vue';

interface Props {
  error?: unknown;
  loading?: boolean;
  padding?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  error: null,
  loading: false,
  padding: false,
});

const localError = ref(false);

onErrorCaptured((err, instance) => {
  // TODO Handle gracefully
  localError.value = true;
});

// TODO Not working...
const error = computed<boolean>(() => {
  return props.error != null || localError.value;
});
</script>

<style scoped></style>
