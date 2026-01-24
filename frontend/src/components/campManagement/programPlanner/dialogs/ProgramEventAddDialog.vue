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
            :rules="[
              (val?: string) => val?.length || t('field.title.rule.required'),
            ]"
            hide-bottom-space
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="title" />
            </template>
          </translated-input>

          <translated-input
            v-model="data.location"
            :label="t('field.location.label')"
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="place" />
            </template>
          </translated-input>

          <translated-input
            v-model="data.details"
            :label="t('field.details.label')"
            autogrow
            outlined
            rounded
          >
            <template #prepend>
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
            v-model="fullDay"
            :label="t('field.fullDay.label')"
          />

          <!-- time & duration -->
          <div
            v-if="!fullDay"
            class="row no-wrap q-gutter-sm"
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
                  (data.time && isDateLater(data.time, val)) ||
                  t('field.end.rule.later'),
              ]"
              hide-bottom-space
              outlined
              rounded
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
          <q-input
            v-model="data.color"
            :rules="['anyColor']"
            hide-bottom-space
            outlined
            rounded
          >
            <template #prepend>
              <q-icon
                name="circle"
                :style="{ color: data.color }"
              />
            </template>
            <template #append>
              <q-icon
                name="colorize"
                class="cursor-pointer"
              >
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-color
                    v-model="data.color"
                    default-view="palette"
                  />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <!-- side -->
          <q-btn-toggle
            v-model="data.side"
            :options="sideOptions"
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
import {
  addToDate,
  getTime,
  parseTimestamp,
} from '@quasar/quasar-ui-qcalendar';

import { QPopupProxy, QSelectOption, useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, reactive, ref } from 'vue';
import TranslatedInput from 'components/common/inputs/TranslatedInput.vue';
import { ProgramEventCreateData } from '@camp-registration/common/entities';

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const props = defineProps<{
  date?: string;
  time?: string;
  duration?: number;
  dateTimeMin?: string;
  dateTimeMax?: string;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const data = reactive<Partial<ProgramEventCreateData>>({
  date: props.date,
  time: props.time,
  duration: props.duration,
  side: 'auto',
  color: '#0000ff',
});

const fullDay = computed<boolean>({
  get() {
    return !data.time || !data.duration;
  },
  set(fullDay) {
    data.time = fullDay ? null : (props.time ?? '12:00');
    data.duration = fullDay ? null : (props.duration ?? 30);
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

const sideOptions = ref<QSelectOption[]>([
  {
    label: t('field.side.left'),
    value: 'left',
  },
  {
    label: t('field.side.auto'),
    value: 'auto',
  },
  {
    label: t('field.side.right'),
    value: 'right',
  },
]);

const monthYearMin = computed<string | undefined>(() => {
  return props.dateTimeMin ? extractYearMonth(props.dateTimeMin) : undefined;
});

const monthYearMax = computed<string | undefined>(() => {
  return props.dateTimeMax ? extractYearMonth(props.dateTimeMax) : undefined;
});

function extractYearMonth(date: string): string {
  const year = date.substring(0, 4); // Extracts YYYY
  const month = date.substring(5, 7); // Extracts MM
  return `${year}/${month}`;
}

function dateOptions(date: string): boolean {
  const selectedDate = new Date(date);
  const dateTimeMin = props.dateTimeMin ? new Date(props.dateTimeMin) : null;
  const dateTimeMax = props.dateTimeMax ? new Date(props.dateTimeMax) : null;

  return (
    (!dateTimeMin || selectedDate >= dateTimeMin) &&
    (!dateTimeMax || selectedDate <= dateTimeMax)
  );
}

function onOKClick(): void {
  onDialogOK({
    ...data,
    duration: fullDay.value ? 24 : data.duration,
  });
}

function isDateLater(timeStart: string, timeEnd: string) {
  const [hoursStart, minutesStart] = timeStart.split(':').map(Number);
  const [hoursEnd, minutesEnd] = timeEnd.split(':').map(Number);

  return hoursStart === hoursEnd
    ? minutesStart < minutesEnd
    : hoursStart < hoursEnd;
}

function timeDifference(timeStart: string, timeEnd: string) {
  const [hoursStart, minutesStart] = timeStart.split(':').map(Number);
  const [hoursEnd, minutesEnd] = timeEnd.split(':').map(Number);

  // Convert the times to total minutes
  const totalMinutesStart = hoursStart * 60 + minutesStart;
  const totalMinutesEnd = hoursEnd * 60 + minutesEnd;

  // Find the absolute difference in minutes
  return totalMinutesEnd - totalMinutesStart;
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Add Event'

field:
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
  side:
    left: 'Left'
    auto: 'Auto'
    right: 'Right'
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
  side:
    left: 'Links'
    auto: 'Automatisch'
    right: 'Rechts'
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
  side:
    left: 'Gauche'
    auto: 'Automatique'
    right: 'Droit'
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

<style lang="scss">
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
