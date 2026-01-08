<template>
  <page-state-handler
    :error
    :loading
  >
    <result-table-interactive
      v-if="camp"
      class="absolute fit"
      :questions="columns"
      :registrations="registrations ?? []"
      :templates="templates ?? []"
      :camp
      @export="onTemplatesPrint"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useRegistrationsStore } from 'stores/registration-store';
import ResultTableInteractive from 'components/campManagement/table/ResultTableInteractive.vue';
import { useTemplateStore } from 'stores/template-store';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import type { TableColumnTemplate } from '@camp-registration/common/entities';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { extractFormFields } from 'src/utils/surveyJS';
import type { PrintTablesPayload } from 'components/campManagement/table/PrintTablesPayload';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';

const campDetailStore = useCampDetailsStore();
const { data: camp } = storeToRefs(campDetailStore);
const registrationStore = useRegistrationsStore();
const { data: registrations } = storeToRefs(registrationStore);
const templateStore = useTemplateStore();
const { data: templates } = storeToRefs(templateStore);

const quasar = useQuasar();
const { locale } = useI18n();
const { to } = useObjectTranslation();

campDetailStore.fetchData();
registrationStore.fetchData();
templateStore.fetchData();

const loading = computed<boolean>(() => {
  return (
    registrationStore.isLoading ||
    campDetailStore.isLoading ||
    templateStore.isLoading
  );
});

const error = computed<string | null>(() => {
  return campDetailStore.error ?? registrationStore.error;
});

const columns = computed<TableColumnTemplate[]>(() => {
  if (!camp.value?.form) {
    return [];
  }

  return extractFormFields(camp.value.form).map<TableColumnTemplate>(
    ({ label, value }) => ({
      name: value,
      label: to(label),
      field: value,
      align: 'left',
      sortable: true,
    }),
  );
});

async function onTemplatesPrint(templateIds: string[]) {
  if (!templateStore.data || !camp.value) {
    return;
  }

  const templates = templateStore.data?.filter((t) =>
    templateIds.includes(t.id),
  );

  // Ensure data is present

  // Build payload
  const payload: PrintTablesPayload = {
    locale: locale.value,
    questions: columns.value,
    registrations: registrations.value ?? [],
    camp: camp.value,
    templateOptions: templates,
  };

  // Store payload for the print route
  const key = `print:tables:${camp.value.id}:${Date.now()}`;
  sessionStorage.setItem(key, JSON.stringify(payload));

  // Create iframe pointing to print route
  const iframe = createHiddenPrintIframe(
    `/print/tables?key=${encodeURIComponent(key)}`,
  );

  const onMessage = (ev: MessageEvent) => {
    if (ev.origin !== window.location.origin) {
      return;
    }
    if (!ev.data || typeof ev.data !== 'object' || !('type' in ev.data)) {
      return;
    }

    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      iframe.remove();
      sessionStorage.removeItem(key);
    };

    if (ev.data.type === 'PRINT_TABLES:ERROR') {
      quasar.notify({
        type: 'negative',
        message: 'An error occurred while preparing the printout.',
        caption: ev.data.error,
      });
      cleanup();
      return;
    }

    // Can be used to show a loading indicator
    if (ev.data.type === 'PRINT_TABLES:AFTERPRINT') {
      cleanup();
    }
  };

  window.addEventListener('message', onMessage);
}

function createHiddenPrintIframe(src: string): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.src = src;

  // IMPORTANT: do not use display:none (print needs layout)
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';

  document.body.appendChild(iframe);
  return iframe;
}
</script>
