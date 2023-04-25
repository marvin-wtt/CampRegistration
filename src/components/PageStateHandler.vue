<template>
  <q-page :padding="props.padding">
    <div
      v-if="loading || error"
      class="absolute fit row justify-center"
    >
      <slot
        v-if="loading"
        name="loading"
      >
        <div class="self-center">
          <q-spinner
            color="primary"
            size="100px"
          />
        </div>
      </slot>

      <slot
        v-else-if="error"
        name="error"
      >
        <div class="text-center self-center">
          <q-icon
            name="error"
            size="xl"
          />

          <p class="text-h4">
            {{ props.error || 'Error' }}
          </p>
        </div>
      </slot>
    </div>

    <slot
      v-else
      class="col self-baseline"
    />
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

const error = computed<boolean>(() => {
  return props.error != null || localError.value;
});

const loading = computed<boolean>(() => {
  return props.loading;
});

onErrorCaptured((err, instance) => {
  // TODO Handle gracefully
  localError.value = true;
});

// TODO Not working...
</script>

<style scoped></style>
