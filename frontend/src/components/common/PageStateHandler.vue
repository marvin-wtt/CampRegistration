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
        <div class="text-center self-center">
          <q-icon
            name="error"
            size="xl"
          />
          <p class="text-h4">
            {{ errorMessage || t('error') }}
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
  // TODO Handle gracefully
  localError.value = err.name + ': ' + err.message;
});
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
error: 'Error'
leave:
  title: 'Unsaved changes'
  message: 'You have unsaved changes. These changes will be lost if you proceed.'
  cancel: 'Cancel'
  ok: 'Proceed'
</i18n>

<i18n lang="yaml" locale="de">
error: 'Fehler'
leave:
  title: 'Ungespeicherte Änderungen'
  message: 'Sie haben ungespeicherte Änderungen. Diese gehen verloren, wenn Sie fortfahren.'
  cancel: 'Abbrechen'
  ok: 'Fortfahren'
</i18n>

<i18n lang="yaml" locale="fr">
error: 'Erreur'
leave:
  title: 'Modifications non enregistrées'
  message: 'Vous avez des modifications non enregistrées. Elles seront perdues si vous continuez.'
  cancel: 'Annuler'
  ok: 'Continuer'
</i18n>

<i18n lang="yaml" locale="pl">
error: 'Błąd'
leave:
  title: 'Niezapisane zmiany'
  message: 'Masz niezapisane zmiany. Zostaną one utracone, jeśli będziesz kontynuować.'
  cancel: 'Anuluj'
  ok: 'Kontynuuj'
</i18n>

<i18n lang="yaml" locale="cs">
error: 'Chyba'
leave:
  title: 'Neuložené změny'
  message: 'Máte neuložené změny. Pokud budete pokračovat, budou ztraceny.'
  cancel: 'Zrušit'
  ok: 'Pokračovat'
</i18n>
