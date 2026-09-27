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

    <!-- Cell renderers are async components; Suspense resolves only once all
         of them have loaded, and printing waits for that. -->
    <suspense
      v-else
      @resolve="onDocumentRendered"
    >
      <div class="print-document">
        <section
          v-for="(template, i) in payload.templates"
          :key="template.id ?? i"
          class="print-sheet"
          :class="printOrientationClass(template.printOptions?.orientation)"
          :style="{ page: sheetPageName(i) }"
        >
          <header class="print-header">
            <div class="print-header__title">
              {{ to(template.title) }}
            </div>

            <div
              v-if="!marginBoxes"
              class="print-header__meta"
            >
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

          <footer
            v-if="!marginBoxes"
            class="print-footer"
          >
            <div class="print-footer__left">{{ to(template.title) }}</div>
            <div class="print-footer__center">{{ timestamp }}</div>
            <div class="print-footer__right">
              {{ i + 1 }} / {{ payload.templates.length }}
            </div>
          </footer>
        </section>
      </div>
    </suspense>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ResultTablePrint from '@/features/participants/components/ResultTablePrint.vue';
import type { PrintTablesPayload } from '@/features/participants/components/PrintTablesPayload';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { usePrintPage, waitForStableLayout } from '@/composables/printPage';
import {
  assignPageOrientation,
  LANDSCAPE_CLASS_NAME,
  printOrientationClass,
  type PrintOrientation,
} from '@/features/participants/pages/pageOrientation';
import {
  cssString,
  PAGE_COUNTER,
  pageRule,
  supportsMarginBoxes,
  usePageStyle,
} from '@/utils/printMarginBoxes';

const { d } = useI18n();
const { to } = useObjectTranslation();

const marginBoxes = supportsMarginBoxes();

// Resolved by the Suspense boundary once every async cell renderer inside the
// document has loaded. Without it, a cold chunk cache (the print page always
// boots fresh) lets window.print() fire while cells are still empty.
let onDocumentRendered!: () => void;
const documentRendered = new Promise<void>((resolve) => {
  onDocumentRendered = resolve;
});

// Known only once the tables are measured, right before printing.
const sheetOrientations = ref<PrintOrientation[]>([]);

const { payload, error } = usePrintPage<PrintTablesPayload>({
  messagePrefix: 'PRINT_TABLES',
  prepare: async () => {
    await documentRendered;
    await waitForStableLayout();
    assignPageOrientation();
    sheetOrientations.value = Array.from(
      document.querySelectorAll('.print-sheet'),
      (sheet) =>
        sheet.classList.contains(LANDSCAPE_CLASS_NAME)
          ? 'landscape'
          : 'portrait',
    );
  },
});

const timestamp = computed<string>(() =>
  d(new Date(payload.value?.timestamp ?? Date.now()), 'dateTime'),
);

// One named page per sheet, so the footer can carry that sheet's title. It
// overrides the orientation class's named page, hence the size here.
function sheetPageName(index: number): string {
  return `table-${index}`;
}

usePageStyle(
  computed<string>(() => {
    if (!payload.value) {
      return '';
    }

    const rules = [
      pageRule({
        'top-left': cssString(to(payload.value.event.name)),
        'bottom-center': cssString(timestamp.value),
        'bottom-right': PAGE_COUNTER,
      }),
      ...payload.value.templates.map((template, i) =>
        pageRule(
          { 'bottom-left': cssString(to(template.title)) },
          {
            name: sheetPageName(i),
            size: `A4 ${sheetOrientations.value[i] ?? 'portrait'}`,
          },
        ),
      ),
    ];

    return rules.join('\n');
  }),
);
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
