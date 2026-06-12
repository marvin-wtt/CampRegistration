<template>
  <q-page :padding="usePadding">
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
        <div class="text-center self-center column items-center q-gutter-y-md">
          <q-icon
            name="error_outline"
            size="80px"
            color="negative"
          />
          <p class="text-h5 q-mb-none">
            {{ t('error.title') }}
          </p>
          <p
            v-if="errorMessage"
            class="text-body2 text-grey-7 q-mb-none"
          >
            {{ errorMessage }}
          </p>

          <q-btn
            :label="t('error.retry')"
            icon="refresh"
            color="primary"
            rounded
            unelevated
            no-caps
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
import { useI18n } from 'vue-i18n';

const {
  error = null,
  loading = false,
  padding = false,
  preventLeave = false,
} = defineProps<{
  error?: string | string[] | null;
  loading?: boolean;
  padding?: boolean;
  preventLeave?: boolean;
}>();

const quasar = useQuasar();
const router = useRouter();
const { t } = useI18n();

const localError = ref<string | null>(null);

const pageError = computed<boolean>(() => {
  return errorMessage.value != null;
});

const errorMessage = computed<string | undefined | null>(() => {
  return error ? (Array.isArray(error) ? error[0] : error) : localError.value;
});

const usePadding = computed<boolean>(() => {
  return padding && !loading && !pageError.value;
});

onBeforeMount(() => {
  window.addEventListener('beforeunload', preventPageLeave);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', preventPageLeave);
});

function preventPageLeave(event: BeforeUnloadEvent) {
  if (!preventLeave) {
    return;
  }

  event.preventDefault();
  event.returnValue = '';
}

onBeforeRouteLeave(() => {
  if (!preventLeave) {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    quasar
      .dialog({
        title: t('leave.title'),
        message: t('leave.message'),
        cancel: {
          label: t('leave.cancel'),
          color: 'primary',
          rounded: true,
          outline: true,
        },
        ok: {
          label: t('leave.ok'),
          color: 'warning',
          rounded: true,
        },
        persistent: true,
      })
      .onOk(() => {
        resolve(true);
      })
      .onCancel(() => {
        resolve(false);
      });
  });
});

function refreshPage() {
  router.go(0);
}

onErrorCaptured((err) => {
  // eslint-disable-next-line no-console
  console.error('PageStateHandler captured an error:', err);
  localError.value = err.message;
  // Stop the error from propagating further up the component tree so the
  // rest of the app keeps working while this page shows the error state.
  return false;
});
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
error:
  title: 'Something went wrong'
  retry: 'Retry'
leave:
  title: 'Unsaved changes'
  message: 'You have unsaved changes. These changes will be lost if you proceed.'
  cancel: 'Cancel'
  ok: 'Proceed'
</i18n>

<i18n lang="yaml" locale="de">
error:
  title: 'Etwas ist schiefgelaufen'
  retry: 'Erneut versuchen'
leave:
  title: 'Ungespeicherte Änderungen'
  message: 'Sie haben ungespeicherte Änderungen. Diese gehen verloren, wenn Sie fortfahren.'
  cancel: 'Abbrechen'
  ok: 'Fortfahren'
</i18n>

<i18n lang="yaml" locale="fr">
error:
  title: 'Une erreur est survenue'
  retry: 'Réessayer'
leave:
  title: 'Modifications non enregistrées'
  message: 'Vous avez des modifications non enregistrées. Elles seront perdues si vous continuez.'
  cancel: 'Annuler'
  ok: 'Continuer'
</i18n>

<i18n lang="yaml" locale="pl">
error:
  title: 'Coś poszło nie tak'
  retry: 'Spróbuj ponownie'
leave:
  title: 'Niezapisane zmiany'
  message: 'Masz niezapisane zmiany. Zostaną one utracone, jeśli będziesz kontynuować.'
  cancel: 'Anuluj'
  ok: 'Kontynuuj'
</i18n>

<i18n lang="yaml" locale="cs">
error:
  title: 'Něco se pokazilo'
  retry: 'Zkusit znovu'
leave:
  title: 'Neuložené změny'
  message: 'Máte neuložené změny. Pokud budete pokračovat, budou ztraceny.'
  cancel: 'Zrušit'
  ok: 'Pokračovat'
</i18n>
