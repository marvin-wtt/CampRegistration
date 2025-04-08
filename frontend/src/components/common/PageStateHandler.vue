<template>
  <q-page :padding>
    <div
      v-if="loading || pageError"
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
        v-else-if="pageError"
        name="error"
      >
        <div class="text-center self-center">
          <q-icon
            name="error"
            size="xl"
          />
          <p class="text-h4">
            {{ errorMessage || 'Error' }}
          </p>

          <q-btn
            icon="refresh"
            round
            color="primary"
            @click="refreshPage()"
          />
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
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

interface Props {
  error?: string | string[] | null;
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
const router = useRouter();

const localError = ref<string | null>(null);

const pageError = computed<boolean>(() => {
  return errorMessage.value != null;
});

const errorMessage = computed<string | undefined | null>(() => {
  return props.error
    ? Array.isArray(props.error)
      ? props.error[0]
      : props.error
    : localError.value;
});

const loading = computed<boolean>(() => {
  return props.loading;
});

const padding = computed<boolean>(() => {
  return props.padding && !loading.value && !pageError.value;
});

onBeforeMount(() => {
  window.addEventListener('beforeunload', preventPageLeave);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', preventPageLeave);
});

function preventPageLeave(event: BeforeUnloadEvent) {
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

function refreshPage() {
  router.go(0);
}

onErrorCaptured((err) => {
  // TODO Handle gracefully
  localError.value = err.name + ': ' + err.message;
});
</script>

<style scoped></style>
