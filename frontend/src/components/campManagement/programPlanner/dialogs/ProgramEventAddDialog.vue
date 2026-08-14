<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none">
      <q-form
        @submit="onOKClick"
        @reset="onDialogCancel"
      >
        <q-card-section>
          <div class="text-h5 text-center">
            {{ t('title') }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-sm column">
          <translated-input
            v-model="data.title"
            :locales="props.locales ?? []"
            :label="t('field.title.label')"
            :rules="[
              (val?: string) => !!val?.length || t('field.title.rule.required'),
            ]"
            hide-bottom-space
            autofocus
            default-untranslated
            outlined
            rounded
          >
            <template #before>
              <q-icon name="title" />
            </template>
          </translated-input>

          <translated-input
            v-model="data.location"
            :locales="props.locales ?? []"
            :label="t('field.location.label')"
            default-untranslated
            outlined
            rounded
          >
            <template #before>
              <q-icon name="place" />
            </template>
          </translated-input>

          <translated-input
            v-model="data.details"
            :locales="props.locales ?? []"
            :label="t('field.details.label')"
            default-untranslated
            autogrow
            outlined
            rounded
          >
            <template #before>
              <q-icon name="description" />
            </template>
          </translated-input>

          <!-- Date -->
          <q-input
            v-model="data.date"
            :label="t('field.date.label')"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="calendar_month" />
            </template>
            <template #append>
              <q-icon
                name="event"
                class="cursor-pointer"
              >
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-date
                    v-model="data.date"
                    mask="YYYY-MM-DD"
                    :options="dateOptions"
                    :navigation-min-year-month="monthYearMin"
                    :navigation-max-year-month="monthYearMax"
                  >
                    <div class="row items-center justify-end">
                      <q-btn
                        v-close-popup
                        :label="t('action.close')"
                        color="primary"
                        flat
                        rounded
                      />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <q-toggle
            v-if="data.date"
            v-model="fullDay"
            :label="t('field.fullDay.label')"
          />

          <!-- time & duration -->
          <div
            v-if="data.date && !fullDay"
            class="row q-gutter-sm"
          >
            <!-- time -->
            <time-of-day-input
              v-model="data.time"
              :label="t('field.start.label')"
              :rules="['time']"
              class="col-12 col-sm"
              hide-bottom-space
              outlined
              rounded
            />

            <!-- duration -->
            <time-of-day-input
              v-model="timeEnd"
              :label="t('field.end.label')"
              :rules="[
                'time',
                (val: string) =>
                  (data.time && isValidTimeRange(data.time, val)) ||
                  t('field.end.rule.later'),
              ]"
              class="col-12 col-sm"
              hide-bottom-space
              outlined
              rounded
            />
          </div>

          <!-- color -->
          <color-picker-input
            v-model="data.color"
            :label="t('field.color.label')"
          />

          <!-- plan -->
          <q-btn-toggle
            v-model="data.plan"
            :options="planOptions"
            spread
            outline
            rounded
          />
        </q-card-section>

        <!-- action buttons -->
        <q-card-actions align="right">
          <q-btn
            type="reset"
            outline
            rounded
            color="primary"
            :label="t('action.cancel')"
          />
          <q-btn
            type="submit"
            rounded
            color="primary"
            :label="t('action.ok')"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { addToDate, getTime, parseTimestamp } from '@timestamp-js/core';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, reactive, ref, watch } from 'vue';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';
import ColorPickerInput from '@/components/common/inputs/ColorPickerInput.vue';
import TimeOfDayInput from '@/components/common/inputs/TimeOfDayInput.vue';
import type {
  ProgramEventCreateData,
  Translatable,
} from '@camp-registration/common/entities';
import { isoToLocalDate, isValidTimeRange, timeDifference } from '@/utils/date';

const { t } = useI18n();
const $q = useQuasar();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const props = defineProps<{
  date?: string;
  time?: string | null;
  duration?: number | null;
  plan?: 'a' | 'b' | 'both';
  dateTimeMin?: string;
  dateTimeMax?: string;
  title?: Translatable;
  location?: Translatable | null;
  details?: Translatable | null;
  color?: string | null;
  locales?: string[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const data = reactive<Partial<ProgramEventCreateData>>({
  title: props.title ?? '',
  date: props.date ?? null,
  time: props.time ?? null,
  duration: props.duration ?? null,
  location: props.location ?? null,
  details: props.details ?? null,
  color: props.color ?? '#2196F3',
  plan: props.plan ?? 'both',
});

const fullDay = ref<boolean>(!data.time || !data.duration);

function computeEndTime(
  time: string | null | undefined,
  duration: number | null | undefined,
): string {
  if (!time) {
    return '23:59';
  }

  if (!duration) {
    return time;
  }

  const ts = parseTimestamp('0000-00-00 ' + time);
  if (!ts) {
    return '--:--';
  }

  return getTime(addToDate(ts, { minute: duration }));
}

const timeEnd = ref<string>(computeEndTime(data.time, data.duration));

watch(fullDay, (value) => {
  data.time = value ? null : (props.time ?? '12:00');
  data.duration = value ? null : (props.duration ?? 30);

  if (!value) {
    timeEnd.value = computeEndTime(data.time, data.duration);
  }
});

// Start and end are independent inputs; editing one keeps the other fixed
// and recomputes duration, rather than duration staying fixed and end drifting.
watch([() => data.time, timeEnd], ([time, end]) => {
  if (!time) {
    return;
  }

  data.duration = timeDifference(time, end);
});

const planOptions = computed(() => {
  const showLabel = $q.screen.gt.xs;
  return [
    {
      ...(showLabel && { label: t('field.plan.a') }),
      value: 'a',
      icon: 'wb_sunny',
    },
    {
      ...(showLabel && { label: t('field.plan.both') }),
      value: 'both',
      icon: 'repeat',
    },
    {
      ...(showLabel && { label: t('field.plan.b') }),
      value: 'b',
      icon: 'water_drop',
    },
  ];
});

const monthYearMin = computed<string | undefined>(() => {
  return props.dateTimeMin ? extractYearMonth(props.dateTimeMin) : undefined;
});

const monthYearMax = computed<string | undefined>(() => {
  return props.dateTimeMax ? extractYearMonth(props.dateTimeMax) : undefined;
});

function extractYearMonth(dateTime: string): string {
  const [year, month] = isoToLocalDate(dateTime).split('-');
  return `${year}/${month}`;
}

function dateOptions(date: string): boolean {
  const dateStr = date.replace(/\//g, '-');
  const dateMin = props.dateTimeMin ? isoToLocalDate(props.dateTimeMin) : null;
  const dateMax = props.dateTimeMax ? isoToLocalDate(props.dateTimeMax) : null;

  return (!dateMin || dateStr >= dateMin) && (!dateMax || dateStr <= dateMax);
}

function onOKClick(): void {
  onDialogOK({
    ...data,
    time: fullDay.value ? null : data.time,
    duration: fullDay.value ? null : data.duration,
  });
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Add Event'

field:
  color:
    label: 'Color'
  date:
    label: 'Date'
  details:
    label: 'Details'
  end:
    label: 'End time'
    rule:
      later: 'End must be after start time'
  fullDay:
    label: 'Full Day'
  location:
    label: 'Location'
  plan:
    a: 'Plan A'
    b: 'Plan B'
    both: 'Both'
  start:
    label: 'Start time'
  title:
    label: 'Title'
    rule:
      required: 'The title is required'

action:
  cancel: 'Cancel'
  close: 'Close'
  ok: 'Create'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Ereignis hinzufügen'

field:
  color:
    label: 'Farbe'
  date:
    label: 'Datum'
  details:
    label: 'Details'
  end:
    label: 'Endzeit'
    rule:
      later: 'Das Ende muss nach der Startzeit liegen'
  fullDay:
    label: 'Ganztägig'
  location:
    label: 'Ort'
  plan:
    a: 'Plan A'
    b: 'Plan B'
    both: 'Beide'
  start:
    label: 'Startzeit'
  title:
    label: 'Titel'
    rule:
      required: 'Der Titel ist erforderlich'

action:
  cancel: 'Abbrechen'
  close: 'Schließen'
  ok: 'Erstellen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Ajouter un événement'

field:
  color:
    label: 'Couleur'
  date:
    label: 'Date'
  details:
    label: 'Détails'
  end:
    label: 'Heure de fin'
    rule:
      later: "La fin doit être après l'heure de début"
  fullDay:
    label: 'Journée entière'
  location:
    label: 'Lieu'
  plan:
    a: 'Plan A'
    b: 'Plan B'
    both: 'Les deux'
  start:
    label: 'Heure de début'
  title:
    label: 'Titre'
    rule:
      required: 'Le titre est requis'

action:
  cancel: 'Annuler'
  close: 'Fermer'
  ok: 'Créer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Dodaj wydarzenie'

field:
  color:
    label: 'Kolor'
  date:
    label: 'Data'
  details:
    label: 'Szczegóły'
  end:
    label: 'Czas zakończenia'
    rule:
      later: 'Koniec musi być po czasie rozpoczęcia'
  fullDay:
    label: 'Cały dzień'
  location:
    label: 'Lokalizacja'
  plan:
    a: 'Plan A'
    b: 'Plan B'
    both: 'Oba'
  start:
    label: 'Czas rozpoczęcia'
  title:
    label: 'Tytuł'
    rule:
      required: 'Tytuł jest wymagany'

action:
  cancel: 'Anuluj'
  close: 'Zamknij'
  ok: 'Utwórz'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Přidat událost'

field:
  color:
    label: 'Barva'
  date:
    label: 'Datum'
  details:
    label: 'Podrobnosti'
  end:
    label: 'Čas ukončení'
    rule:
      later: 'Konec musí být po čase začátku'
  fullDay:
    label: 'Celý den'
  location:
    label: 'Místo'
  plan:
    a: 'Plán A'
    b: 'Plán B'
    both: 'Oba'
  start:
    label: 'Čas začátku'
  title:
    label: 'Název'
    rule:
      required: 'Název je povinný'

action:
  cancel: 'Zrušit'
  close: 'Zavřít'
  ok: 'Vytvořit'
</i18n>

<style lang="scss">
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
