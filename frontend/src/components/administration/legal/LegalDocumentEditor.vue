<template>
  <q-card
    flat
    bordered
  >
    <q-form
      class="column no-wrap full-height"
      @reset="onReset"
      @submit="onSave"
    >
      <!-- Locale switcher and the "shared" toggle share one row. In shared mode
           the tabs are hidden because a single value is stored for every
           language (a plain string rather than a per-locale record). -->
      <div class="legal-document-editor__header q-px-md">
        <!-- One locale at a time: legal documents are long, so all five side by
             side (as a translated input would show them) is unworkable. -->
        <q-tabs
          v-if="!sharedMode"
          v-model="activeLocale"
          align="left"
          dense
          no-caps
          mobile-arrows
          outside-arrows
          active-color="primary"
          indicator-color="primary"
          class="col legal-document-editor__tabs text-on-surface-variant"
        >
          <q-tab
            v-for="loc in locales"
            :key="loc"
            :name="loc"
          >
            <div class="row items-center no-wrap q-gutter-xs">
              <country-icon :locale="loc" />
              <span class="text-caption text-weight-medium">
                {{ loc.toUpperCase() }}
              </span>
            </div>
          </q-tab>
        </q-tabs>
        <div
          v-else
          class="text-caption text-on-surface-variant q-py-sm"
        >
          {{ t('shared.hint') }}
        </div>

        <q-toggle
          :model-value="sharedMode"
          :label="t('shared.label')"
          dense
          left-label
          @update:model-value="onSharedModeChange"
        />
      </div>

      <q-separator />

      <q-card-section class="col q-pa-none legal-document-editor__content">
        <rich-text-editor
          v-model="activeContent"
          :placeholder="t('placeholder')"
          class="fit"
        />
      </q-card-section>

      <q-separator />

      <q-card-actions>
        <q-btn
          :label="t('action.save')"
          type="submit"
          color="primary"
          :loading="saving"
          :disable="!isModified"
          rounded
        />
        <q-btn
          :label="t('action.reset')"
          type="reset"
          :disable="!isModified"
          outline
          rounded
        />
      </q-card-actions>
    </q-form>
  </q-card>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import CountryIcon from '@/components/common/localization/CountryIcon.vue';
import RichTextEditor from '@/components/common/inputs/RichTextEditor.vue';
import { useLegalService } from '@/services/LegalService';
import { useServiceNotifications } from '@/composables/serviceHandler';
import type {
  LegalDocumentType,
  Translatable,
} from '@camp-registration/common/entities';

const { type, content: initialContent } = defineProps<{
  type: LegalDocumentType;
  content: Translatable | null;
}>();

const { t } = useI18n();
const { updateLegalDocument } = useLegalService();
const { withResultNotification } = useServiceNotifications();

// The app's fixed locale set (see CLAUDE.md) — legal content is instance-wide,
// unlike camp fields whose locales follow the camp's target countries.
const locales = ['en', 'de', 'fr', 'cs', 'pl'];

// The editor works with a per-locale record; a plain string (a value shared
// across every language) is kept separately in `shared` under "shared" mode.
function toRecord(value: Translatable | null): Record<string, string> {
  const record: Record<string, string> = {};
  for (const loc of locales) {
    record[loc] = '';
  }

  if (value && typeof value !== 'string') {
    for (const [loc, text] of Object.entries(value)) {
      record[loc] = text;
    }
  }

  return record;
}

// Reduce editor state to what is actually stored: a plain string when a single
// value is shared across languages, a compacted per-locale record otherwise,
// or `null` when everything is empty. Keys are sorted so the comparison in
// `isModified` is insensitive to record key order (the backend may return them
// in any order). Drops empty locales so blank tabs never count as a change.
function normalize(value: Translatable | null): Translatable | null {
  if (typeof value === 'string') {
    return value.trim().length > 0 ? value : null;
  }

  if (value) {
    const entries = Object.entries(value)
      .filter(([, text]) => text.trim().length > 0)
      .sort(([a], [b]) => a.localeCompare(b));
    return entries.length > 0 ? Object.fromEntries(entries) : null;
  }

  return null;
}

const saving = ref<boolean>(false);
const activeLocale = ref<string>(locales[0] ?? 'en');

// A plain-string document is one value shared across every language; a record
// is per-locale. The mode follows the loaded content and can be toggled.
const sharedMode = ref<boolean>(typeof initialContent === 'string');
const shared = ref<string>(
  typeof initialContent === 'string' ? initialContent : '',
);
const translations = reactive<Record<string, string>>(toRecord(initialContent));

// The revert target for Reset and the baseline for `isModified`. Distinct from
// `initialContent` (the prop): the parent fetches documents once and never
// refreshes them after a save, so the prop would keep pointing at the pre-save
// content forever — this tracks the actual last-saved state instead.
const baseline = ref<Translatable | null>(initialContent);

// Reset all editor state (mode, shared value, per-locale record) from a stored
// document and record it as the new revert/comparison baseline.
function applyContent(value: Translatable | null): void {
  sharedMode.value = typeof value === 'string';
  shared.value = typeof value === 'string' ? value : '';
  Object.assign(translations, toRecord(value));
  baseline.value = value;
}

// The parent fetches both documents together and passes the result down, so
// re-sync whenever it resolves or reloads (the prop is `null` until then).
watch(
  () => initialContent,
  (value) => {
    applyContent(value);
  },
);

// Carry the current text across a mode switch so toggling never silently drops
// what was typed. Entering shared mode adopts the active (or first non-empty)
// locale; leaving it seeds the active locale only when there is nothing to
// preserve, so distinct per-locale values survive an accidental toggle.
function onSharedModeChange(value: boolean): void {
  if (value) {
    const active = translations[activeLocale.value] ?? '';
    const firstFilled = Object.values(translations).find(
      (text) => text.trim().length > 0,
    );
    shared.value = active.trim().length > 0 ? active : (firstFilled ?? '');
  } else {
    const hasContent = Object.values(translations).some(
      (text) => text.trim().length > 0,
    );
    if (!hasContent && shared.value.trim().length > 0) {
      translations[activeLocale.value] = shared.value;
    }
  }
  sharedMode.value = value;
}

// Index access is `string | undefined` under the strict tsconfig; this proxy
// keeps the editor's v-model a plain `string` and routes it to the shared value
// or the active locale depending on the mode.
const activeContent = computed<string>({
  get: () =>
    sharedMode.value ? shared.value : (translations[activeLocale.value] ?? ''),
  set: (value) => {
    if (sharedMode.value) {
      shared.value = value;
    } else {
      translations[activeLocale.value] = value;
    }
  },
});

// The document as it would be stored: a plain string in shared mode, the
// per-locale record otherwise.
const currentContent = computed<Translatable | null>(() =>
  sharedMode.value ? shared.value : translations,
);

const isModified = computed<boolean>(() => {
  return (
    JSON.stringify(normalize(currentContent.value)) !==
    JSON.stringify(normalize(baseline.value))
  );
});

async function onSave() {
  saving.value = true;
  try {
    const payload = normalize(currentContent.value);

    const document = await withResultNotification('save', () =>
      updateLegalDocument(type, payload),
    );
    applyContent(document.content);
  } finally {
    saving.value = false;
  }
}

function onReset() {
  applyContent(baseline.value);
}

// Exposed so the parent can flag unsaved changes on its document-switcher tab —
// otherwise switching tabs could silently discard an in-progress edit.
defineExpose({ isModified });
</script>

<style scoped>
/* A flex item of the card's column layout: min-height:0 lets it shrink
   below the editor's content size instead of pushing q-card-actions off
   the bottom, so the rich-text-editor scrolls internally instead. */
.legal-document-editor__content {
  min-height: 0;
  overflow: hidden;
}

/* On narrow screens the long "shared" toggle label would crush the tabs down to
   an unusable width, so stack the toggle onto its own row below the tabs; from
   Quasar's `sm` breakpoint up there is room to place them side by side. */
.legal-document-editor__header {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
}

@media (min-width: 600px) {
  .legal-document-editor__header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
}

/* Let the tabs shrink below their content width inside the flex row so Quasar's
   overflow arrows/scrolling engage instead of the tabs overflowing the row. */
.legal-document-editor__tabs {
  min-width: 0;
}
</style>

<i18n lang="yaml" locale="en">
placeholder: 'Write the content shown to visitors on this page…'
shared:
  label: 'Same for all languages'
  hint: 'This content is shown for every language.'
action:
  save: 'Save'
  reset: 'Reset'
request:
  save:
    success: 'Saved successfully'
    error: 'Failed to save'
</i18n>

<i18n lang="yaml" locale="de">
placeholder: 'Verfasse den Inhalt, der Besuchern auf dieser Seite angezeigt wird…'
shared:
  label: 'Für alle Sprachen gleich'
  hint: 'Dieser Inhalt wird für jede Sprache angezeigt.'
action:
  save: 'Speichern'
  reset: 'Zurücksetzen'
request:
  save:
    success: 'Erfolgreich gespeichert'
    error: 'Speichern fehlgeschlagen'
</i18n>

<i18n lang="yaml" locale="fr">
placeholder: 'Rédigez le contenu affiché aux visiteurs sur cette page…'
shared:
  label: 'Identique pour toutes les langues'
  hint: 'Ce contenu est affiché pour toutes les langues.'
action:
  save: 'Enregistrer'
  reset: 'Réinitialiser'
request:
  save:
    success: 'Enregistré avec succès'
    error: "Échec de l'enregistrement"
</i18n>

<i18n lang="yaml" locale="pl">
placeholder: 'Wpisz treść wyświetlaną odwiedzającym na tej stronie…'
shared:
  label: 'Takie samo dla wszystkich języków'
  hint: 'Ta treść jest wyświetlana dla każdego języka.'
action:
  save: 'Zapisz'
  reset: 'Resetuj'
request:
  save:
    success: 'Zapisano pomyślnie'
    error: 'Nie udało się zapisać'
</i18n>

<i18n lang="yaml" locale="cs">
placeholder: 'Napište obsah zobrazený návštěvníkům na této stránce…'
shared:
  label: 'Stejné pro všechny jazyky'
  hint: 'Tento obsah se zobrazuje pro všechny jazyky.'
action:
  save: 'Uložit'
  reset: 'Obnovit'
request:
  save:
    success: 'Úspěšně uloženo'
    error: 'Uložení se nezdařilo'
</i18n>
