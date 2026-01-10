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
import {
  onBeforeUnmount,
  onMounted,
  nextTick,
  ref,
  computed,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';
import ResultTablePrint from 'components/campManagement/table/ResultTablePrint.vue';
import type { PrintTablesPayload } from 'components/campManagement/table/PrintTablesPayload';
import { useObjectTranslation } from 'src/composables/objectTranslation';

const route = useRoute();
const { to } = useObjectTranslation();

const payload = ref<PrintTablesPayload | null>(null);
const timestamp = ref<string>('');
const error = ref<string | null>(null);

// Storage key can be provided (recommended when multiple exports could overlap)
const storageKey = computed<string>(() => {
  const key = (route.query.key as string | undefined)?.trim();
  return key && key.length > 0 ? key : 'print:tables:payload';
});

function postToParent(msg: unknown) {
  // Works for iframe usage; harmless otherwise
  try {
    window.parent?.postMessage(msg, window.location.origin);
  } catch {
    // ignore
  }
}

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

function readPayloadFromSessionStorage(): PrintTablesPayload | null {
  const raw = sessionStorage.getItem(storageKey.value);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as PrintTablesPayload;
  } catch {
    return null;
  }
}

function cleanupSessionStorage() {
  try {
    sessionStorage.removeItem(storageKey.value);
  } catch {
    // ignore
  }
}

async function waitForFonts() {
  // Some environments don’t support document.fonts
  const anyDoc = document as unknown as { fonts?: { ready?: Promise<void> } };
  if (anyDoc.fonts?.ready) {
    try {
      await anyDoc.fonts.ready;
    } catch {
      // ignore
    }
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

async function waitForStableLayout() {
  await nextTick();
  await waitForFonts();
  // Two frames is usually enough for Quasar/QTable layout + icon/font settling
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
}

function triggerPrint() {
  // Tell parent we’re about to print (useful to disable UI/spinners)
  postToParent({ type: 'PRINT_TABLES:PRINTING' });

  // Print dialog (user saves as PDF)
  window.print();
}

function onAfterPrint() {
  // Cleanup storage to avoid stale data
  cleanupSessionStorage();

  // Signal parent to cleanup iframe
  postToParent({ type: 'PRINT_TABLES:AFTERPRINT' });
}

onMounted(async () => {
  window.addEventListener('afterprint', onAfterPrint);

  // Load payload (sessionStorage is simplest)
  const p = readPayloadFromSessionStorage();
  if (!p) {
    error.value =
      'No print payload found. Please start the export from the management page.';
    postToParent({ type: 'PRINT_TABLES:ERROR', error: error.value });
    return;
  }

  payload.value = p;

  // Let parent know we loaded it
  postToParent({ type: 'PRINT_TABLES:LOADED' });

  await waitForStableLayout();

  assignPageOrientation();

  // Ready → parent can call iframeWindow.print() too, but we can auto-print.
  postToParent({ type: 'PRINT_TABLES:READY' });

  triggerPrint();
});

onBeforeUnmount(() => {
  window.removeEventListener('afterprint', onAfterPrint);
});
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
