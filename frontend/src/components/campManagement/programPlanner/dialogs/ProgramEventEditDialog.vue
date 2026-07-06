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
            :label="t('field.title.label')"
            :locales="props.locales ?? []"
            :rules="[
              (val?: string) => val?.length || t('field.title.rule.required'),
            ]"
            hide-bottom-space
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
            :label="t('field.location.label')"
            :locales="props.locales ?? []"
            default-untranslated
            clearable
            outlined
            rounded
          >
            <template #before>
              <q-icon name="place" />
            </template>
          </translated-input>

          <translated-input
            v-model="data.details"
            :label="t('field.details.label')"
            :locales="props.locales ?? []"
            default-untranslated
            autogrow
            clearable
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
            <q-input
              v-model="data.time"
              :label="t('field.start.label')"
              mask="time"
              :rules="['time']"
              hide-bottom-space
              outlined
              rounded
              class="col-12 col-sm"
            >
              <template #append>
                <q-icon
                  name="access_time"
                  class="cursor-pointer"
                >
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-time v-model="data.time">
                      <div class="row items-center justify-end">
                        <q-btn
                          v-close-popup
                          :label="t('action.close')"
                          color="primary"
                          flat
                          rounded
                        />
                      </div>
                    </q-time>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <!-- duration -->
            <q-input
              v-model="timeEnd"
              :label="t('field.end.label')"
              mask="time"
              :rules="[
                'time',
                (val: string) =>
                  (data.time && isValidTimeRange(data.time, val)) ||
                  t('field.end.rule.later'),
              ]"
              hide-bottom-space
              outlined
              rounded
              class="col-12 col-sm"
            >
              <template #append>
                <q-icon
                  name="access_time"
                  class="cursor-pointer"
                >
                  <q-popup-proxy
                    transition-show="scale"
                    transition-hide="scale"
                    cover
                  >
                    <q-time v-model="timeEnd">
                      <div class="row items-center justify-end">
                        <q-btn
                          v-close-popup
                          :label="t('action.close')"
                          color="primary"
                          flat
                          rounded
                        />
                      </div>
                    </q-time>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
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
            :label="t('action.cancel')"
            type="reset"
            color="primary"
            outline
            rounded
          />
          <q-btn
            :label="t('action.ok')"
            type="submit"
            color="primary"
            rounded
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { addToDate, getTime, parseTimestamp } from '@timestamp-js/core';
import { QPopupProxy, useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, reactive, toRaw } from 'vue';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';
import ColorPickerInput from '@/components/common/inputs/ColorPickerInput.vue';
import type {
  ProgramEvent,
  ProgramEventUpdateData,
} from '@camp-registration/common/entities';
import { isValidTimeRange, timeDifference } from '@/utils/date';

const { t } = useI18n();
const $q = useQuasar();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const props = defineProps<{
  event: ProgramEvent;
  dateTimeMin?: string;
  dateTimeMax?: string;
  locales?: string[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const data = reactive<ProgramEventUpdateData>(initialData());

function initialData(): ProgramEventUpdateData {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...data } = structuredClone(toRaw(props.event));

  return data;
}

const fullDay = computed<boolean>({
  get() {
    return !data.time || !data.duration;
  },
  set(fullDay) {
    data.time = fullDay ? null : (props.event.time ?? '12:00');
    data.duration = fullDay ? null : (props.event.duration ?? 30);
  },
});

const timeEnd = computed<string>({
  get() {
    if (!data.time) {
      return '23:59';
    }

    if (!data.duration) {
      return data.time;
    }

    const ts = parseTimestamp('0000-00-00 ' + data.time);
    if (!ts) {
      return '--:--';
    }

    return getTime(addToDate(ts, { minute: data.duration }));
  },
  set(time) {
    if (!data.time) {
      data.time = '00:00';
    }
    data.duration = timeDifference(data.time, time);
  },
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

function extractYearMonth(date: string): string {
  const year = date.substring(0, 4);
  const month = date.substring(5, 7);
  return `${year}/${month}`;
}

function dateOptions(date: string): boolean {
  const dateStr = date.replace(/\//g, '-');
  const dateMin = props.dateTimeMin?.substring(0, 10) ?? null;
  const dateMax = props.dateTimeMax?.substring(0, 10) ?? null;

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
title: 'Edit Event'

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
  ok: 'Save'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Ereignis bearbeiten'

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
  ok: 'Speichern'
</i18n>

<i18n lang="yaml" locale="fr">
title: "Modifier l'événement"

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
  ok: 'Enregistrer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Edytuj wydarzenie'

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
  ok: 'Zapisz'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Upravit událost'

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
  ok: 'Uložit'
</i18n>

<style lang="scss">
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
