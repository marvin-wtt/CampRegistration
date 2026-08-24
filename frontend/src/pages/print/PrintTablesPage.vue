<template>
  <q-page class="print-page">
    <div
      v-if="error"
      class="q-pa-md"
    >
      <q-banner
        inline-actions
        rounded
        class="bg-negative text-white"
      >
        {{ error }}
      </q-banner>
    </div>

    <div
      v-else-if="!payload"
      class="q-pa-md"
    >
      <q-banner
        rounded
        class="bg-grey-3 text-black"
      >
        Preparing document…
      </q-banner>
    </div>

    <div
      v-else
      class="print-document"
    >
      <section
        v-for="(template, i) in payload.templates"
        :key="template.id ?? i"
        class="print-sheet"
        :class="printOrientationClass(template.printOptions?.orientation)"
      >
        <header class="print-header">
          <div class="print-header__title">
            {{ to(template.title) }}
          </div>

          <div class="print-header__meta">
            <span>{{ to(payload.event.name) }}</span>
          </div>
        </header>

        <result-table-print
          :title="to(template.title)"
          :questions="payload.questions"
          :registrations="payload.registrations"
          :event="payload.event"
          :template
        />

        <footer class="print-footer">
          <div class="print-footer__left">{{ to(template.title) }}</div>
          <div class="print-footer__center">{{ timestamp }}</div>
          <div class="print-footer__right">
            {{ i + 1 }} / {{ payload.templates.length }}
          </div>
        </footer>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import ResultTablePrint from '@/components/eventManagement/table/ResultTablePrint.vue';
import type { PrintTablesPayload } from '@/components/eventManagement/table/PrintTablesPayload';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { usePrintPage, waitForStableLayout } from '@/composables/printPage';
import {
  assignPageOrientation,
  printOrientationClass,
} from '@/pages/print/pageOrientation';

const { to } = useObjectTranslation();

const timestamp = ref<string>('');

const { payload, error } = usePrintPage<PrintTablesPayload>({
  messagePrefix: 'PRINT_TABLES',
  defaultStorageKey: 'print:tables:payload',
  prepare: async () => {
    await waitForStableLayout();
    assignPageOrientation();
  },
});

watch(payload, (value) => {
  timestamp.value = formatDate(
    value?.timestamp ?? new Date().toISOString(),
    value?.locale,
  );
});

function formatDate(iso: string, locale?: string): string {
  const date = new Date(iso);
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}
</script>

<style scoped>
.print-page {
  background: white;
}

/* Each table on its own page */
.print-sheet {
  break-after: page;
  page-break-after: always; /* fallback */
}

/* Avoid an extra blank page after the last section in most browsers */
.print-sheet:last-child {
  break-after: auto;
  page-break-after: auto;
}

/* Header */
.print-header {
  margin-bottom: 5mm;
  padding-bottom: 3mm;
}

.print-header__title {
  font-size: 14pt;
  font-weight: 600;
  line-height: 1.2;
}

.print-header__meta {
  margin-top: 1.5mm;
  font-size: 9.5pt;
  line-height: 1.2;
  opacity: 0.75;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

/* Footer */
.print-footer {
  margin-top: 3mm;
  padding-top: 3mm;
  border-top: 1px solid rgba(0, 0, 0, 0.12);

  font-size: 9pt;
  opacity: 0.75;

  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
}

.print-footer__left {
  justify-self: start;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70mm;
}

.print-footer__center {
  justify-self: center;
  white-space: nowrap;
}

.print-footer__right {
  justify-self: end;
  white-space: nowrap;
}
</style>
