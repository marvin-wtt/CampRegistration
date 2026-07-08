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

      <q-card-section class="full-height">
        <rich-text-editor
          v-model="activeContent"
          :placeholder="t('placeholder')"
          class="fit"
        />
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
const activeLocale = ref<string>(locales[0] ?? 'en');

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

// Index access is `string | undefined` under the strict tsconfig; this proxy
// keeps the editor's v-model a plain `string`.
const activeContent = computed<string>({
  get: () => translations[activeLocale.value] ?? '',
  set: (value) => {
    translations[activeLocale.value] = value;
  },
});

const isModified = computed<boolean>(() => {
  return JSON.stringify(compact(translations)) !== original.value;
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

// Exposed so the parent can flag unsaved changes on its document-switcher tab —
// otherwise switching tabs could silently discard an in-progress edit.
defineExpose({ isModified });
</script>

<i18n lang="yaml" locale="en">
placeholder: 'Write the content shown to visitors on this page…'
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
action:
  save: 'Uložit'
  reset: 'Obnovit'
request:
  save:
    success: 'Úspěšně uloženo'
    error: 'Uložení se nezdařilo'
</i18n>
