<template>
  <q-page :padding="padding">
    <div
      v-if="loading || error"
      class="absolute fit row justify-center"
    >
      <slot
        v-if="loading"
        name="loading"
      >
        <!-- TODO Can we use <q-inner-loading> instead ?-->
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
import {
  computed,
  onBeforeMount,
  onBeforeUnmount,
  onErrorCaptured,
  ref,
} from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useQuasar } from 'quasar';

interface Props {
  error?: unknown;
  loading?: boolean;
  padding?: boolean;
  preventLeave?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  error: null,
  loading: false,
  padding: false,
  preventLeave: false,
});

const quasar = useQuasar();

const localError = ref(false);

const error = computed<boolean>(() => {
  return props.error != null || localError.value;
});

const loading = computed<boolean>(() => {
  return props.loading;
});

const padding = computed<boolean>(() => {
  return props.padding && !loading.value && !error.value;
});

onBeforeMount(() => {
  window.addEventListener('beforeunload', preventPageLeave);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', preventPageLeave);
});

function preventPageLeave(event) {
  if (!props.preventLeave) {
    return;
  }

  event.preventDefault();
  event.returnValue = '';
}

onBeforeRouteLeave((to, from, next) => {
  if (!props.preventLeave) {
    next();
    return;
  }

  quasar
    .dialog({
      title: 'Unsaved changes',
      message:
        'You have unsaved changes. These changes will be lost if you proceed',
      cancel: true,
      persistent: true,
    })
    .onOk(() => {
      next();
    })
    .onDismiss(() => {
      next(false);
    })
    .onCancel(() => {
      next(false);
    });
});

onErrorCaptured((err, instance) => {
  // TODO Handle gracefully
  localError.value = true;
});

// TODO Not working...
</script>

<style scoped></style>
