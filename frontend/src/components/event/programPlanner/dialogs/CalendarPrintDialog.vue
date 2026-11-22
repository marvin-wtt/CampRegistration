<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('title')"
      :width="440"
      @submit="onOKClick"
      @cancel="onDialogCancel"
    >
      <div class="print-options column no-wrap">
        <!-- Only for the page's print; a day's print has its day -->
        <section v-if="range">
          <date-range-input
            v-model:from="start"
            v-model:to="end"
            date-only
            :event-days="eventDays"
            :selectable="selectable"
            :label="t('field.range.label')"
            :hint="t('field.range.hint', { count: MAX_DAYS })"
            :error="tooLong"
            :error-message="t('field.range.tooLong', { count: MAX_DAYS })"
            data-test="print-range"
          >
            <template #prepend>
              <q-icon name="date_range" />
            </template>
          </date-range-input>
        </section>

        <section>
          <div class="column q-gutter-y-sm">
            <q-select
              v-if="locales.length > 1"
              v-model="options.locale"
              :options="languageOptions"
              :label="t('field.language.label')"
              emit-value
              map-options
              outlined
              rounded
              data-test="print-language"
            >
              <template #prepend>
                <q-icon name="translate" />
              </template>
            </q-select>
            <q-btn-toggle
              v-model="options.plan"
              :options="planOptions"
              class="full-width"
              color="surface-container-high"
              text-color="on-surface"
              toggle-color="secondary-container"
              toggle-text-color="on-secondary-container"
              spread
              unelevated
              rounded
              no-caps
              data-test="print-plan"
            />
          </div>
        </section>

        <section>
          <div class="print-options__heading">{{ t('section.display') }}</div>
          <q-list class="print-options__list">
            <q-item
              v-for="toggle in toggles"
              :key="toggle.key"
              v-ripple
              tag="label"
            >
              <q-item-section avatar>
                <q-icon :name="toggle.icon" />
              </q-item-section>
              <q-item-section>{{ toggle.label }}</q-item-section>
              <q-item-section side>
                <q-toggle
                  v-model="options[toggle.key]"
                  :data-test="`print-${toggle.key}`"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </section>
      </div>

      <template #actions>
        <q-btn
          type="reset"
          outline
          rounded
          color="primary"
          :label="t('action.cancel')"
        />
        <q-btn
          type="submit"
          icon="print"
          :disable="tooLong || (!!range && (!start || !end))"
          rounded
          color="primary"
          :label="t('action.print')"
          data-test="print-confirm"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts">
export interface CalendarPrintOptions {
  // The one language to print; null prints all of them
  locale: string | null;
  plan: 'a' | 'b' | 'both';
  location: boolean;
  details: boolean;
  birthdays: boolean;
  monochrome: boolean;
}

export interface CalendarPrintChoice {
  options: CalendarPrintOptions;
  // Set only when the dialog was given a range to edit
  range?: { start: string; end: string };
}
</script>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import DateRangeInput from '@/components/common/inputs/DateRangeInput.vue';
import { daysBetweenDates, parseLocalDate } from '@/utils/date';

// The widest the landscape sheet stays legible
const MAX_DAYS = 10;
const ALL = 'all';

const {
  locales,
  initial,
  range = null,
  eventDays,
  selectable,
  birthdaysAvailable = false,
} = defineProps<{
  locales: string[];
  initial: CalendarPrintOptions;
  range?: { start: string; end: string } | null;
  // Inclusive `YYYY-MM-DD` days: marked in the picker, and the ones allowed
  eventDays?: { from: string; to: string } | undefined;
  selectable?: { from: string; to: string } | undefined;
  birthdaysAvailable?: boolean;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { t, locale } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const options = reactive({
  ...initial,
  locale:
    initial.locale && locales.includes(initial.locale) ? initial.locale : ALL,
});

const start = ref<string | undefined>(range?.start);
const end = ref<string | undefined>(range?.end);

// The landscape sheet stops being legible beyond this
const tooLong = computed<boolean>(
  () =>
    !!start.value &&
    !!end.value &&
    daysBetweenDates(parseLocalDate(start.value), parseLocalDate(end.value)) +
      1 >
      MAX_DAYS,
);

function languageName(code: string): string {
  try {
    const names = new Intl.DisplayNames([locale.value], { type: 'language' });
    return names.of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

const languageOptions = computed(() => [
  { label: t('field.language.all'), value: ALL },
  ...locales.map((code) => ({ label: languageName(code), value: code })),
]);

type ToggleKey = 'location' | 'details' | 'birthdays' | 'monochrome';

const toggles = computed<{ key: ToggleKey; icon: string; label: string }[]>(
  () => [
    {
      key: 'location' as const,
      icon: 'place',
      label: t('field.location.label'),
    },
    { key: 'details' as const, icon: 'notes', label: t('field.details.label') },
    ...(birthdaysAvailable
      ? [
          {
            key: 'birthdays' as const,
            icon: 'cake',
            label: t('field.birthdays.label'),
          },
        ]
      : []),
    {
      key: 'monochrome' as const,
      icon: 'contrast',
      label: t('field.monochrome.label'),
    },
  ],
);

const planOptions = computed(() => [
  { label: t('field.plan.a'), value: 'a' },
  { label: t('field.plan.both'), value: 'both' },
  { label: t('field.plan.b'), value: 'b' },
]);

function onOKClick() {
  const choice: CalendarPrintChoice = {
    options: {
      ...options,
      locale: options.locale === ALL ? null : options.locale,
    },
  };
  if (range && start.value && end.value) {
    choice.range = { start: start.value, end: end.value };
  }
  onDialogOK(choice);
}
</script>

<style lang="scss" scoped>
.print-options {
  gap: 20px;

  &__heading {
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 500;
    color: var(--md3-on-surface-variant);
  }

  &__hint {
    margin: 4px 0 0 16px;
    font-size: 12px;
    color: var(--md3-on-surface-variant);
  }

  // A grouped settings list: one rounded surface, whole rows clickable
  &__list {
    overflow: hidden;
    border-radius: 16px;
    background: var(--md3-surface-container-high);
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Print'
section:
  display: 'Display'
field:
  range:
    label: 'Period'
    hint: 'At most {count} days'
    tooLong: 'Pick at most {count} days'
  language:
    label: 'Language'
    all: 'All languages'
  plan:
    label: 'Plan'
    a: 'Plan A'
    b: 'Plan B'
    both: 'Both'
  location:
    label: 'Locations'
  details:
    label: 'Details'
  birthdays:
    label: 'Birthdays'
  monochrome:
    label: 'Black and white'
action:
  cancel: 'Cancel'
  print: 'Print'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Drucken'
section:
  display: 'Anzeige'
field:
  range:
    label: 'Zeitraum'
    hint: 'Höchstens {count} Tage'
    tooLong: 'Wähle höchstens {count} Tage'
  language:
    label: 'Sprache'
    all: 'Alle Sprachen'
  plan:
    label: 'Plan'
    a: 'Plan A'
    b: 'Plan B'
    both: 'Beide'
  location:
    label: 'Orte'
  details:
    label: 'Details'
  birthdays:
    label: 'Geburtstage'
  monochrome:
    label: 'Schwarz-weiß'
action:
  cancel: 'Abbrechen'
  print: 'Drucken'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Imprimer'
section:
  display: 'Affichage'
field:
  range:
    label: 'Période'
    hint: '{count} jours au maximum'
    tooLong: 'Choisissez {count} jours au maximum'
  language:
    label: 'Langue'
    all: 'Toutes les langues'
  plan:
    label: 'Plan'
    a: 'Plan A'
    b: 'Plan B'
    both: 'Les deux'
  location:
    label: 'Lieux'
  details:
    label: 'Détails'
  birthdays:
    label: 'Anniversaires'
  monochrome:
    label: 'Noir et blanc'
action:
  cancel: 'Annuler'
  print: 'Imprimer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Drukuj'
section:
  display: 'Wyświetlanie'
field:
  range:
    label: 'Okres'
    hint: 'Maksymalnie {count} dni'
    tooLong: 'Wybierz maksymalnie {count} dni'
  language:
    label: 'Język'
    all: 'Wszystkie języki'
  plan:
    label: 'Plan'
    a: 'Plan A'
    b: 'Plan B'
    both: 'Oba'
  location:
    label: 'Miejsca'
  details:
    label: 'Szczegóły'
  birthdays:
    label: 'Urodziny'
  monochrome:
    label: 'Czarno-biały'
action:
  cancel: 'Anuluj'
  print: 'Drukuj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Tisk'
section:
  display: 'Zobrazení'
field:
  range:
    label: 'Období'
    hint: 'Nejvýše {count} dní'
    tooLong: 'Vyberte nejvýše {count} dní'
  language:
    label: 'Jazyk'
    all: 'Všechny jazyky'
  plan:
    label: 'Plán'
    a: 'Plán A'
    b: 'Plán B'
    both: 'Oba'
  location:
    label: 'Místa'
  details:
    label: 'Podrobnosti'
  birthdays:
    label: 'Narozeniny'
  monochrome:
    label: 'Černobíle'
action:
  cancel: 'Zrušit'
  print: 'Tisk'
</i18n>
