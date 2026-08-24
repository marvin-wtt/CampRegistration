<template>
  <page-state-handler
    :error
    :loading
  >
    <result-table-interactive
      v-if="event"
      class="absolute fit"
      :questions="columns"
      :registrations="registrations ?? []"
      :templates="templates ?? []"
      :event
      @export="onTemplatesPrint"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useRegistrationsStore } from '@/stores/registration-store';
import ResultTableInteractive from '@/components/eventManagement/table/ResultTableInteractive.vue';
import { useTemplateStore } from '@/stores/template-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useRouteQueryParams } from '@/composables/useRouteQueryParams';
import type { TableColumnTemplate } from '@camp-registration/common/entities';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import RegistrationDetailsDialog from '@/components/eventManagement/table/dialogs/RegistrationDetailsDialog.vue';
import { extractFormFields } from '@/utils/surveyJS';
import type { PrintTablesPayload } from '@/components/eventManagement/table/PrintTablesPayload';
import { openPrintIframe } from '@/utils/printIframe';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';

const eventDetailStore = useEventDetailsStore();
const { data: event } = storeToRefs(eventDetailStore);
const registrationStore = useRegistrationsStore();
const { data: registrations } = storeToRefs(registrationStore);
const templateStore = useTemplateStore();
const { data: templates } = storeToRefs(templateStore);

const router = useRouter();
const route = useRoute();
const { getStringQueryParam } = useRouteQueryParams();
const quasar = useQuasar();
const { locale } = useI18n();
const { to } = useObjectTranslation();

onMounted(async () => {
  await Promise.allSettled([
    eventDetailStore.fetchData(),
    registrationStore.fetchData(),
    templateStore.fetchData(),
  ]);

  openLinkedRegistration();
});

function openLinkedRegistration(): void {
  const registrationId = getStringQueryParam('registrationId');
  if (!registrationId) {
    return;
  }

  const registration = registrations.value?.find(
    (r) => r.id === registrationId,
  );

  const removeQueryParam = () => {
    // Drop the param so refresh/back-nav doesn't reopen the dialog
    void router.replace({
      query: { ...route.query, registrationId: undefined },
    });
  };

  if (!registration) {
    removeQueryParam();
  }

  quasar
    .dialog({
      component: RegistrationDetailsDialog,
      componentProps: { registrationId },
    })
    .onDismiss(() => {
      removeQueryParam();
    });
}

const loading = computed<boolean>(() => {
  return (
    registrationStore.isLoading ||
    eventDetailStore.isLoading ||
    templateStore.isLoading
  );
});

const error = computed<string | null>(() => {
  return eventDetailStore.error ?? registrationStore.error;
});

const columns = computed<TableColumnTemplate[]>(() => {
  if (!event.value?.form) {
    return [];
  }

  return extractFormFields(event.value.form).map<TableColumnTemplate>(
    ({ label, value }) => ({
      name: value,
      label: to(label),
      field: value,
      align: 'left',
      sortable: true,
    }),
  );
});

function onTemplatesPrint(templateIds: string[]) {
  if (!templateStore.data || !event.value) {
    return;
  }

  const templates = templateStore.data
    .filter((t) => templateIds.includes(t.id))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  // Build payload
  const payload: PrintTablesPayload = {
    locale: locale.value,
    questions: columns.value,
    registrations: registrations.value ?? [],
    event: event.value,
    templates,
    timestamp: new Date().toISOString(),
  };

  // Store payload for the print route
  const key = `print:tables:${event.value.id}:${Date.now()}`;
  sessionStorage.setItem(key, JSON.stringify(payload));

  openPrintIframe(`/print/tables?key=${encodeURIComponent(key)}`, {
    messagePrefix: 'PRINT_TABLES',
    // Render at A4 landscape printable size (the widest sheet) so the print
    // page lays out in a desktop-sized viewport instead of a 0x0 one.
    widthPx: 1032,
    heightPx: 1123,
    onError: (error) => {
      quasar.notify({
        type: 'negative',
        message: 'An error occurred while preparing the printout.',
        caption: error,
      });
    },
    onAfterPrint: () => {
      sessionStorage.removeItem(key);
    },
  });
}
</script>
