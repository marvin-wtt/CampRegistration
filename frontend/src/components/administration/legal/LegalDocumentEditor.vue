<template>
  <q-card
    flat
    bordered
    class="legal-document-editor"
  >
    <q-form
      @reset="onReset"
      @submit="onSave"
    >
      <q-card-section class="row items-center no-wrap q-gutter-sm">
        <q-icon
          :name="icon"
          color="primary"
          size="20px"
        />
        <div class="text-subtitle2 text-weight-bold">{{ title }}</div>
        <q-space />
        <q-btn-toggle
          v-model="view"
          :options="[
            { value: 'edit', slot: 'edit' },
            { value: 'preview', slot: 'preview' },
          ]"
          no-caps
          unelevated
          dense
          rounded
          toggle-color="primary"
          color="surface-container-high"
          text-color="on-surface-variant"
        >
          <template #edit>
            <q-icon
              name="edit"
              size="18px"
              class="q-mr-xs"
            />
            {{ t('view.edit') }}
          </template>
          <template #preview>
            <q-icon
              name="visibility"
              size="18px"
              class="q-mr-xs"
            />
            {{ t('view.preview') }}
          </template>
        </q-btn-toggle>
      </q-card-section>

      <!-- One locale at a time: legal documents are long, so all five side by
           side (as a translated input would show them) is unworkable. -->
      <q-tabs
        v-model="activeLocale"
        align="left"
        dense
        no-caps
        active-color="primary"
        indicator-color="primary"
        class="text-on-surface-variant"
      >
        <q-tab
          v-for="loc in locales"
          :key="loc"
          :name="loc"
          :alert="hasContent(loc) ? 'primary' : false"
          alert-icon="circle"
        >
          <div class="row items-center no-wrap q-gutter-xs">
            <country-icon :locale="loc" />
            <span class="text-caption text-weight-medium">
              {{ loc.toUpperCase() }}
            </span>
          </div>
        </q-tab>
      </q-tabs>

      <q-separator />

      <q-card-section>
        <q-input
          v-show="view === 'edit'"
          v-model="translations[activeLocale]"
          type="textarea"
          :label="t('field.content')"
          :input-style="{ minHeight: '420px', fontFamily: 'monospace' }"
          hide-bottom-space
          outlined
        />

        <div
          v-show="view === 'preview'"
          class="legal-preview"
        >
          <!-- eslint-disable-next-line vue/no-v-html -- operator-authored content, not user input -->
          <div
            v-if="previewHtml"
            v-html="previewHtml"
          />
          <div
            v-else
            class="text-grey-6 text-italic"
          >
            {{ t('emptyPreview') }}
          </div>
        </div>
      </q-card-section>

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
import { useLegalService } from '@/services/LegalService';
import { useServiceNotifications } from '@/composables/serviceHandler';
import { createMarkdownConverter } from '@/utils/markdown';
import type {
  LegalDocumentType,
  Translatable,
} from '@camp-registration/common/entities';

const {
  type,
  icon,
  title,
  content: initialContent,
} = defineProps<{
  type: LegalDocumentType;
  icon: string;
  title: string;
  content: Translatable | null;
}>();

const { t, locale } = useI18n();
const { updateLegalDocument } = useLegalService();
const { withResultNotification } = useServiceNotifications();
const converter = createMarkdownConverter();

// The app's fixed locale set (see CLAUDE.md) — legal content is instance-wide,
// unlike camp fields whose locales follow the camp's target countries.
const locales = ['en', 'de', 'fr', 'cs', 'pl'];

// A plain string (legacy/untranslated value) is seeded into the fallback locale
// so it is never lost; the editor always works with a per-locale record.
function toRecord(value: Translatable | null): Record<string, string> {
  const record: Record<string, string> = {};
  for (const loc of locales) {
    record[loc] = '';
  }

  if (typeof value === 'string') {
    record.en = value;
  } else if (value) {
    for (const [loc, text] of Object.entries(value)) {
      record[loc] = text;
    }
  }

  return record;
}

// Drop empty locales so seeding blank tabs never counts as a change and an
// all-empty document is stored as `null` rather than `{en: '', de: '', …}`.
function compact(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record).filter(([, text]) => text.trim().length > 0),
  );
}

const saving = ref<boolean>(false);
const view = ref<'edit' | 'preview'>('edit');
const activeLocale = ref<string>(
  locales.find((loc) => loc === locale.value.split('-')[0]) ?? 'en',
);

const translations = reactive<Record<string, string>>(toRecord(initialContent));
const original = ref<string>(JSON.stringify(compact(translations)));

// The parent fetches both documents together and passes the result down, so
// re-sync whenever it resolves or reloads (the prop is `null` until then).
watch(
  () => initialContent,
  (value) => {
    Object.assign(translations, toRecord(value));
    original.value = JSON.stringify(compact(translations));
  },
);

function hasContent(loc: string): boolean {
  return (translations[loc] ?? '').trim().length > 0;
}

const isModified = computed<boolean>(() => {
  return JSON.stringify(compact(translations)) !== original.value;
});

const previewHtml = computed<string>(() => {
  const value = translations[activeLocale.value] ?? '';

  return value ? converter.render(value) : '';
});

async function onSave() {
  saving.value = true;
  try {
    const compacted = compact(translations);
    const payload = Object.keys(compacted).length > 0 ? compacted : null;

    const document = await withResultNotification('save', () =>
      updateLegalDocument(type, payload),
    );
    Object.assign(translations, toRecord(document.content));
    original.value = JSON.stringify(compact(translations));
  } finally {
    saving.value = false;
  }
}

function onReset() {
  Object.assign(translations, toRecord(initialContent));
}
</script>

<style scoped>
.legal-preview {
  min-height: 452px;
  max-height: 452px;
  padding: 12px 16px;
  border: 1px solid var(--md3-outline-variant);
  border-radius: 12px;
  overflow-y: auto;
}

.legal-preview :deep(h1),
.legal-preview :deep(h2),
.legal-preview :deep(h3) {
  color: var(--md3-on-surface);
}

.legal-preview :deep(a) {
  color: var(--md3-primary);
}
</style>

<i18n lang="yaml" locale="en">
field:
  content: 'Content (Markdown)'
view:
  edit: 'Edit'
  preview: 'Preview'
emptyPreview: 'Nothing to preview yet.'
action:
  save: 'Save'
  reset: 'Reset'
request:
  save:
    success: 'Saved successfully'
    error: 'Failed to save'
</i18n>

<i18n lang="yaml" locale="de">
field:
  content: 'Inhalt (Markdown)'
view:
  edit: 'Bearbeiten'
  preview: 'Vorschau'
emptyPreview: 'Noch nichts zum Vorschauen.'
action:
  save: 'Speichern'
  reset: 'Zurücksetzen'
request:
  save:
    success: 'Erfolgreich gespeichert'
    error: 'Speichern fehlgeschlagen'
</i18n>

<i18n lang="yaml" locale="fr">
field:
  content: 'Contenu (Markdown)'
view:
  edit: 'Modifier'
  preview: 'Aperçu'
emptyPreview: 'Rien à prévisualiser pour le moment.'
action:
  save: 'Enregistrer'
  reset: 'Réinitialiser'
request:
  save:
    success: 'Enregistré avec succès'
    error: "Échec de l'enregistrement"
</i18n>

<i18n lang="yaml" locale="pl">
field:
  content: 'Treść (Markdown)'
view:
  edit: 'Edytuj'
  preview: 'Podgląd'
emptyPreview: 'Nie ma jeszcze nic do podglądu.'
action:
  save: 'Zapisz'
  reset: 'Resetuj'
request:
  save:
    success: 'Zapisano pomyślnie'
    error: 'Nie udało się zapisać'
</i18n>

<i18n lang="yaml" locale="cs">
field:
  content: 'Obsah (Markdown)'
view:
  edit: 'Upravit'
  preview: 'Náhled'
emptyPreview: 'Zatím není co zobrazit.'
action:
  save: 'Uložit'
  reset: 'Obnovit'
request:
  save:
    success: 'Úspěšně uloženo'
    error: 'Uložení se nezdařilo'
</i18n>
