<template>
  <div
    class="text-cell"
    :class="{
      fit: !gridMode,
      'text-cell--grid': gridMode,
      'text-cell--expandable': !gridMode && isTruncated,
    }"
  >
    <span
      v-if="gridMode && isEmpty"
      class="text-cell__placeholder"
    >
      —
    </span>

    <template v-else>
      <span class="text-cell__value">{{
        gridMode ? fullText : cell.text
      }}</span>

      <template v-if="!gridMode && cell.remaining > 0 && showExtra">
        {{ `(+${cell.remaining})` }}
      </template>
    </template>

    <q-btn
      v-if="canTranslate"
      icon="translate"
      round
      flat
      dense
      size="sm"
      class="text-cell__translate-action"
      :class="{ 'text-cell__translate-action--active': showTranslated }"
      :loading="translating"
      @click.stop="toggleTranslation"
    >
      <q-tooltip>
        {{ showTranslated ? t('showOriginal') : t('translate') }}
      </q-tooltip>
    </q-btn>

    <!-- Opens on click/tap on both desktop and mobile; renders as a centered
         dialog on small screens for easy reading and dismissal. Table view
         only — grid mode already shows the full, wrapped text inline. -->
    <q-popup-proxy
      v-if="!gridMode && isTruncated"
      :breakpoint="600"
    >
      <q-banner
        dense
        class="text-cell__banner"
      >
        {{ fullText }}
      </q-banner>
    </q-popup-proxy>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TableCellProps } from '@/components/campManagement/table/tableCells/TableCellProps';
import type { TextOptions } from '@/components/campManagement/table/tableCells/TextOptions';
import { useTranslationStore } from '@/stores/translation-store';

const {
  props: cellProps,
  options,
  printing,
  gridMode = false,
} = defineProps<TableCellProps<TextOptions>>();

const { t, locale } = useI18n();
// Availability is checked once by the store itself; see translation-store.ts.
const translationStore = useTranslationStore();

const DEFAULT_LIMIT = 25;

const showExtra = computed<boolean>(() => options?.showRemaining ?? true);

const limit = computed<number>(() => options?.maxLength ?? DEFAULT_LIMIT);

const isEmpty = computed<boolean>(() => {
  const value = cellProps.value;

  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim().length === 0)
  );
});

// The registration's own locale is the text's source locale — form answers
// are recorded in the language the registrant filled the form in.
const sourceLocale = computed<string | undefined>(() => {
  const rowLocale = cellProps.row.locale;

  return rowLocale.split('-')[0];
});

const userLocale = computed<string>(() => locale.value.split('-')[0]!);

const showTranslated = ref(false);
const translatedText = ref<string | null>(null);
const translating = ref(false);

// Nothing to translate between identical languages, and hidden entirely
// while printing since it's a purely interactive affordance.
const canTranslate = computed<boolean>(() => {
  return (
    !printing &&
    (options?.showTranslate ?? true) &&
    translationStore.available === true &&
    typeof cellProps.value === 'string' &&
    cellProps.value.trim().length > 0 &&
    sourceLocale.value !== undefined &&
    sourceLocale.value !== userLocale.value
  );
});

// Discard a cached translation once the underlying value changes (e.g. the
// field was edited elsewhere) so a stale translation isn't shown.
watch(
  () => cellProps.value,
  () => {
    translatedText.value = null;
    showTranslated.value = false;
  },
);

async function toggleTranslation() {
  if (showTranslated.value) {
    showTranslated.value = false;
    return;
  }

  if (translatedText.value != null) {
    showTranslated.value = true;
    return;
  }

  if (typeof cellProps.value !== 'string' || !sourceLocale.value) {
    return;
  }

  translating.value = true;
  try {
    const result = await translationStore.translate(
      cellProps.value,
      userLocale.value,
      sourceLocale.value,
    );

    if (result != null) {
      translatedText.value = result;
      showTranslated.value = true;
    }
  } finally {
    translating.value = false;
  }
}

// Swaps in the cached translation while `showTranslated` is on; feeds both
// the truncated cell text and the expand-popup's full text below.
const displayValue = computed<unknown>(() => {
  if (showTranslated.value && translatedText.value != null) {
    return translatedText.value;
  }

  return cellProps.value;
});

const cell = computed<{ text: unknown; remaining: number }>(() => {
  const value = displayValue.value;

  if (typeof value !== 'string') {
    return { text: value, remaining: 0 };
  }

  const trimmed = value.trim();

  if (trimmed.length <= limit.value) {
    return { text: trimmed, remaining: 0 };
  }

  const slice = trimmed.slice(0, limit.value);
  const lastSpace = slice.lastIndexOf(' ');
  const text = lastSpace === -1 ? slice : slice.slice(0, lastSpace);

  return { text, remaining: trimmed.length - text.length };
});

const isTruncated = computed<boolean>(() => cell.value.remaining > 0);

// Full (untruncated) value shown in the expand popup, trimmed to match the cell.
const fullText = computed<unknown>(() => {
  const value = displayValue.value;

  return typeof value === 'string' ? value.trim() : value;
});
</script>

<i18n lang="yaml" locale="en">
translate: 'Translate'
showOriginal: 'Show original'
</i18n>

<i18n lang="yaml" locale="de">
translate: 'Übersetzen'
showOriginal: 'Original anzeigen'
</i18n>

<i18n lang="yaml" locale="fr">
translate: 'Traduire'
showOriginal: "Afficher l'original"
</i18n>

<i18n lang="yaml" locale="pl">
translate: 'Przetłumacz'
showOriginal: 'Pokaż oryginał'
</i18n>

<i18n lang="yaml" locale="cs">
translate: 'Přeložit'
showOriginal: 'Zobrazit originál'
</i18n>

<style lang="scss" scoped>
.text-cell {
  display: flex;
  align-items: center;
}

.text-cell--expandable {
  cursor: pointer;
}

// Outside the table grid (row card dialog) there's no fixed cell width to
// clip to, so let the value wrap across multiple lines instead of being
// truncated to a single line.
.text-cell--grid {
  align-items: flex-start;
  white-space: pre-wrap;
  word-break: break-word;
}

.text-cell__value {
  min-width: 0;
}

.text-cell__placeholder {
  color: var(--md3-on-surface-variant);
  opacity: 0.6;
}

// Sits to the trailing edge of the cell; sized down to match the compact
// table row rather than a full-size field marginal icon.
.text-cell__translate-action {
  flex: none;
  margin-left: auto;
  color: var(--md3-on-surface-variant);
}

.text-cell__translate-action--active {
  background-color: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.text-cell__banner {
  max-width: 500px;
  white-space: pre-wrap;
  word-break: break-word;

  // In dialog mode (small screens) fill the available width for easy reading.
  .q-dialog & {
    max-width: 90vw;
  }
}

.body--light {
  a {
    color: #000;
  }
}

.body--dark {
  a {
    color: #fff;
  }
}

a {
  text-decoration: none;
}
</style>
