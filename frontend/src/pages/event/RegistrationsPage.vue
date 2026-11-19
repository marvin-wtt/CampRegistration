<template>
  <page-state-handler :error>
    <!-- Deleted for good under the retention workflow (docs/privacy.md, 8). -->
    <div
      v-if="event?.registrationDataPurgedAt"
      class="absolute fit column items-center justify-center q-pa-lg text-center"
    >
      <q-icon
        name="auto_delete"
        size="48px"
        class="text-on-surface-variant"
      />
      <div class="text-h6 q-mt-md">{{ t('purged.title') }}</div>
      <p class="text-body2 text-on-surface-variant purged-text">
        {{
          t('purged.message', {
            date: d(event.registrationDataPurgedAt, 'date'),
          })
        }}
      </p>
    </div>
    <result-table-interactive
      v-else
      class="absolute fit"
      :loading
      :questions="columns"
      :registrations="registrations ?? []"
      :templates="templates ?? []"
      :event
      @export="onTemplatesPrint"
    />
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useRegistrationsStore } from '@/stores/registration-store';
import ResultTableInteractive from '@/components/event/table/ResultTableInteractive.vue';
import { useTemplateStore } from '@/stores/template-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { useRouteQueryParams } from '@/composables/useRouteQueryParams';
import type { TableColumnTemplate } from '@camp-registration/common/entities';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import RegistrationDetailsDialog from '@/components/event/table/dialogs/RegistrationDetailsDialog.vue';
import { extractFormFields } from '@camp-registration/common/form';
import type {
  PrintTablesPayload,
  PrintTablesSelection,
} from '@/components/event/table/PrintTablesPayload';
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
const { locale } = useI18n({ useScope: 'global' });
const { t, d } = useI18n();
const { to } = useObjectTranslation();

// Started during setup, not awaited: the stores flag themselves loading before
// the first render, so the page renders its skeletons instead of an idle frame.
void loadPage();

async function loadPage(): Promise<void> {
  await Promise.allSettled([
    eventDetailStore.fetchData(),
    registrationStore.fetchData(),
    templateStore.fetchData(),
  ]);

  openLinkedRegistration();
}

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

// Templates count too: without them the table would silently fall back to the
// plain template instead of the one the user expects.
const error = computed<string | null>(() => {
  return (
    eventDetailStore.error ?? registrationStore.error ?? templateStore.error
  );
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

function onTemplatesPrint({ templateIds, groups }: PrintTablesSelection) {
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
    groups,
    timestamp: new Date().toISOString(),
  };

  openPrintIframe('/print/tables', {
    messagePrefix: 'PRINT_TABLES',
    payload,
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
  });
}
</script>

<style scoped>
.purged-text {
  max-width: 28rem;
}
</style>

<i18n lang="yaml" locale="en">
purged:
  title: 'Registration data deleted'
  message: 'All registrations of this event were deleted on {date} under its retention period. The event takes no new registrations.'
</i18n>

<i18n lang="yaml" locale="de">
purged:
  title: 'Anmeldedaten gelöscht'
  message: 'Alle Anmeldungen dieser Veranstaltung wurden am {date} gemäß ihrer Speicherfrist gelöscht. Die Veranstaltung nimmt keine neuen Anmeldungen an.'
</i18n>

<i18n lang="yaml" locale="fr">
purged:
  title: 'Données d’inscription supprimées'
  message: 'Toutes les inscriptions de cet événement ont été supprimées le {date} conformément à leur durée de conservation. L’événement n’accepte plus de nouvelles inscriptions.'
</i18n>

<i18n lang="yaml" locale="pl">
purged:
  title: 'Dane zgłoszeń usunięte'
  message: 'Wszystkie zgłoszenia tego wydarzenia zostały usunięte {date} zgodnie z okresem przechowywania. Wydarzenie nie przyjmuje nowych zgłoszeń.'
</i18n>

<i18n lang="yaml" locale="cs">
purged:
  title: 'Údaje z přihlášek smazány'
  message: 'Všechny přihlášky této akce byly smazány {date} podle lhůty uchování. Akce nepřijímá nové přihlášky.'
</i18n>
