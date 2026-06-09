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
            <span>{{ to(payload.camp.name) }}</span>
          </div>
        </header>

        <result-table-print
          :title="to(template.title)"
          :questions="payload.questions"
          :registrations="payload.registrations"
          :camp="payload.camp"
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
import ResultTablePrint from 'components/campManagement/table/ResultTablePrint.vue';
import type { PrintTablesPayload } from 'components/campManagement/table/PrintTablesPayload';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { usePrintPage, waitForStableLayout } from 'src/composables/printPage';

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

function mmToPx(mm: number): number {
  // CSS inches are fixed: 96px per inch
  return (mm / 25.4) * 96;
}

const UPRIGHT_CLASS_NAME = 'print-sheet--upright' as const;
const LEFT_CLASS_NAME = 'print-sheet--left' as const;

function assignPageOrientation() {
  const pageWidthPx = mmToPx(210); // A4 width
  const marginPx = mmToPx(12 * 2); // left + right
  const printableWidthPx = pageWidthPx - marginPx;

  const sheets = document.querySelectorAll<HTMLElement>('.print-sheet');

  sheets.forEach((sheet) => {
    if (
      sheet.classList.contains('left') ||
      sheet.classList.contains(UPRIGHT_CLASS_NAME)
    ) {
      // already assigned
      return;
    }

    // IMPORTANT: target the actual <table>, not q-table wrappers
    const table = sheet.querySelector<HTMLTableElement>('table');

    if (!table) {
      sheet.classList.add(UPRIGHT_CLASS_NAME);
      return;
    }

    // scrollWidth = real required width
    const requiredWidth = table.scrollWidth;

    if (requiredWidth > printableWidthPx) {
      sheet.classList.add(LEFT_CLASS_NAME);
    } else {
      sheet.classList.add(UPRIGHT_CLASS_NAME);
    }
  });
}

function printOrientationClass(
  orientation: 'portrait' | 'landscape' | undefined,
) {
  if (orientation === 'landscape') {
    return LEFT_CLASS_NAME;
  }
  if (orientation === 'portrait') {
    return UPRIGHT_CLASS_NAME;
  }

  return '';
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
