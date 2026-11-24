<template>
  <div class="row items-center no-wrap">
    <q-tabs
      v-model="model"
      align="left"
      dense
      no-caps
      mobile-arrows
      outside-arrows
      active-color="primary"
      indicator-color="primary"
      class="col locale-tabs text-on-surface-variant"
    >
      <q-tab
        v-for="loc in shownLocales"
        :key="loc"
        :name="loc"
        :data-test="`locale-tab-${loc}`"
      >
        <div class="row items-center no-wrap q-gutter-xs">
          <country-icon :locale="loc" />
          <span class="text-caption text-weight-medium">
            {{ loc.toUpperCase() }}
          </span>
          <q-icon
            v-if="filled?.includes(loc)"
            name="check"
            size="14px"
            class="text-positive"
          />
          <q-btn
            v-if="addLanguages && addedLocales.canRemove(loc)"
            icon="close"
            round
            flat
            dense
            size="xs"
            :aria-label="t('remove', { language: languageName(loc) })"
            :data-test="`remove-translation-${loc}`"
            @click.stop="removeLocale(loc)"
          >
            <q-tooltip>
              {{ t('remove', { language: languageName(loc) }) }}
            </q-tooltip>
          </q-btn>
        </div>
      </q-tab>
    </q-tabs>

    <add-locale-menu
      v-if="addLanguages && addedLocales.missingLocales.value.length"
      :locales="addedLocales.missingLocales.value"
      class="q-ml-sm"
      @add="addLocale"
    />
  </div>
</template>

<script lang="ts" setup>
import CountryIcon from '@/components/common/localization/CountryIcon.vue';
import AddLocaleMenu from '@/components/common/localization/AddLocaleMenu.vue';
import { APP_LOCALES } from '@/i18n/locales';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useAddedLocales, useLanguageName } from '@/composables/addedLocales';

const model = defineModel<string>({ required: true });

const {
  locales = [...APP_LOCALES],
  filled,
  addLanguages = false,
} = defineProps<{
  locales?: string[];
  /** Locales that already have content, marked so gaps are visible at a glance. */
  filled?: string[] | undefined;
  /** Show the user's language and those with text; add others one at a time. */
  addLanguages?: boolean | undefined;
}>();

const emit = defineEmits<{
  /** Clear this locale's text; the tab is already gone. */
  remove: [locale: string];
}>();

const { t } = useI18n();
const quasar = useQuasar();
const languageName = useLanguageName();

const addedLocales = useAddedLocales(
  () => locales,
  () => filled ?? [],
);

const shownLocales = computed<string[]>(() =>
  addLanguages ? addedLocales.shownLocales.value : locales,
);

// The selected tab is always one that is shown.
watch(
  shownLocales,
  (shown) => {
    if (!shown.includes(model.value)) {
      const fallback = addedLocales.defaultLocale.value ?? shown[0];
      if (fallback) {
        model.value = fallback;
      }
    }
  },
  { immediate: true },
);

function addLocale(loc: string) {
  addedLocales.add(loc);
  model.value = loc;
}

// These hold whole documents, so dropping written text is confirmed first.
function removeLocale(loc: string) {
  if (!filled?.includes(loc)) {
    dropLocale(loc);
    return;
  }

  quasar
    .dialog({
      title: t('confirm.title', { language: languageName(loc) }),
      message: t('confirm.message'),
      cancel: {
        label: t('confirm.cancel'),
        color: 'primary',
        rounded: true,
        outline: true,
      },
      ok: {
        label: t('confirm.ok'),
        color: 'error',
        rounded: true,
      },
    })
    .onOk(() => dropLocale(loc));
}

function dropLocale(loc: string) {
  addedLocales.remove(loc);
  emit('remove', loc);
}
</script>

<style scoped>
.locale-tabs {
  min-width: 0;
}
</style>

<i18n lang="yaml" locale="en">
remove: 'Remove {language}'
confirm:
  title: 'Remove {language}?'
  message: 'The text written in this language is deleted.'
  cancel: 'Cancel'
  ok: 'Remove'
</i18n>

<i18n lang="yaml" locale="de">
remove: '{language} entfernen'
confirm:
  title: '{language} entfernen?'
  message: 'Der Text in dieser Sprache wird gelöscht.'
  cancel: 'Abbrechen'
  ok: 'Entfernen'
</i18n>

<i18n lang="yaml" locale="fr">
remove: 'Retirer : {language}'
confirm:
  title: 'Retirer : {language} ?'
  message: 'Le texte rédigé dans cette langue sera supprimé.'
  cancel: 'Annuler'
  ok: 'Retirer'
</i18n>

<i18n lang="yaml" locale="pl">
remove: 'Usuń: {language}'
confirm:
  title: 'Usunąć: {language}?'
  message: 'Tekst napisany w tym języku zostanie usunięty.'
  cancel: 'Anuluj'
  ok: 'Usuń'
</i18n>

<i18n lang="yaml" locale="cs">
remove: 'Odebrat: {language}'
confirm:
  title: 'Odebrat: {language}?'
  message: 'Text napsaný v tomto jazyce bude smazán.'
  cancel: 'Zrušit'
  ok: 'Odebrat'
</i18n>
