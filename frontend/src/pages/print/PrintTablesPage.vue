<!-- src/pages/print/PrintTablesPage.vue -->
<template>
  <q-page>
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
        <template #action>
          <q-btn
            flat
            label="Close"
            @click="closeIfStandalone"
          />
        </template>
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
      >
        <header
          v-if="showHeader"
          class="print-sheet__header"
        >
          <div class="text-subtitle1">
            {{ payload.title || 'Export' }}
          </div>
          <div class="text-caption">
            <span v-if="payload.campTitle">{{ payload.campTitle }} · </span>
            <span>{{ template.title }}</span>
            <span> · {{ formatDate(generatedAt) }}</span>
          </div>
        </header>

        <!-- TODO What about the title? -->
        <result-table-print
          :questions="payload.questions"
          :registrations="payload.registrations"
          :camp="payload.camp"
          :template="template"
        />

        <footer
          v-if="showFooter"
          class="print-sheet__footer text-caption"
        >
          {{ i + 1 }} / {{ payload.templates.length }}
        </footer>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, nextTick, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import ResultTablePrint from 'components/campManagement/table/ResultTablePrint.vue';
import type { PrintTablesPayload } from 'components/campManagement/table/PrintTablesPayload';

const route = useRoute();

const generatedAt = formatDate(new Date().toISOString());
const payload = ref<PrintTablesPayload | null>(null);
const error = ref<string | null>(null);

const showHeader = computed<boolean>(() => route.query.header !== '0');
const showFooter = computed<boolean>(() => route.query.footer === '1');

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

function closeIfStandalone() {
  // If this page is inside an iframe, parent should remove it.
  // If user opened it directly, we can try to close.
  try {
    window.close();
  } catch {
    // ignore
  }
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(payload.value?.locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return iso;
  }
}

function readPayloadFromSessionStorage(): PrintTablesPayload | null {
  const raw = sessionStorage.getItem(storageKey.value);
  if (!raw) return null;
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
  return;

  // Signal parent to cleanup iframe
  postToParent({ type: 'PRINT_TABLES:AFTERPRINT' });

  // Cleanup storage to avoid stale data
  cleanupSessionStorage();

  // If someone opened /print/tables directly, optionally close.
  if (window.parent === window) {
    // standalone tab
    closeIfStandalone();
  }
}

function onMessage(e: MessageEvent) {
  console.log('PrintTablesPage received message:', e);
}

onMounted(async () => {
  window.addEventListener('afterprint', onAfterPrint);
  window.addEventListener('message', onMessage);

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

  // Ready → parent can call iframeWindow.print() too, but we can auto-print.
  postToParent({ type: 'PRINT_TABLES:READY' });

  triggerPrint();
});

onBeforeUnmount(() => {
  window.removeEventListener('afterprint', onAfterPrint);
  window.removeEventListener('message', onMessage);
});
</script>

<style scoped>
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

.print-sheet__header {
  margin-bottom: 8mm;
}

.print-sheet__footer {
  margin-top: 6mm;
  text-align: right;
}
</style>
