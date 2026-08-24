<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none">
      <q-form
        @submit="onOKClick"
        @reset="onCancelClick"
      >
        <q-card-section>
          <div class="text-h6">
            {{ t('title') }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-sm column">
          <!-- Time interval -->
          <q-input
            v-model.number="data.timeInterval"
            :label="t('field.timeInterval.label')"
            :hint="t('field.timeInterval.hint')"
            hide-bottom-space
            outlined
            rounded
          />

          <!-- Day start -->
          <time-of-day-input
            v-model="data.dayStart"
            :label="t('field.dayStart.label')"
            :rules="['time']"
            hide-bottom-space
            outlined
            rounded
          />

          <!-- Day end -->
          <time-of-day-input
            v-model="data.dayEnd"
            :label="t('field.dayEnd.label')"
            :rules="['time']"
            hide-bottom-space
            outlined
            rounded
          />
          <!-- Show all translations -->
          <q-toggle
            v-model="data.showAllTranslations"
            :label="t('field.showAllTranslations.label')"
          />
          <!-- Browse outside event dates -->
          <q-toggle
            v-model="data.browseOutsideEventDates"
            :label="t('field.browseOutsideEventDates.label')"
          />
        </q-card-section>

        <!-- action buttons -->
        <q-card-actions align="right">
          <q-btn
            type="reset"
            outline
            rounded
            color="primary"
            :label="t('actions.cancel')"
          />
          <q-btn
            type="submit"
            rounded
            color="primary"
            :label="t('actions.save')"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { reactive, toRaw } from 'vue';
import TimeOfDayInput from '@/components/common/inputs/TimeOfDayInput.vue';
import type { ProgramPlannerSettings } from '@camp-registration/common/settings';

const { settings } = defineProps<{
  settings: Partial<ProgramPlannerSettings>;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const data = reactive<Partial<ProgramPlannerSettings>>(initialValue());

function initialValue(): Partial<ProgramPlannerSettings> {
  return structuredClone(toRaw(settings));
}

const { t } = useI18n();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

function onOKClick() {
  onDialogOK(data);
}

function onCancelClick() {
  onDialogCancel();
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Calendar Settings'

field:
  dayStart:
    label: 'Day start'
  dayEnd:
    label: 'Day end'
  timeInterval:
    label: 'Time interval'
    hint: 'Minutes per interval'
  showAllTranslations:
    label: 'Show all translations'
  browseOutsideEventDates:
    label: 'Allow browsing outside event dates'

actions:
  save: 'Save'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Kalendereinstellungen'

field:
  dayStart:
    label: 'Tagesbeginn'
  dayEnd:
    label: 'Tagesende'
  timeInterval:
    label: 'Zeitintervall'
    hint: 'Minuten pro Intervall'
  showAllTranslations:
    label: 'Alle Übersetzungen anzeigen'
  browseOutsideEventDates:
    label: 'Navigation außerhalb des Event-Zeitraums erlauben'

actions:
  save: 'Speichern'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Paramètres du calendrier'

field:
  dayStart:
    label: 'Début de journée'
  dayEnd:
    label: 'Fin de journée'
  timeInterval:
    label: 'Intervalle de temps'
    hint: 'Minutes par intervalle'
  showAllTranslations:
    label: 'Afficher toutes les traductions'
  browseOutsideEventDates:
    label: 'Autoriser la navigation en dehors des dates du event'

actions:
  save: 'Enregistrer'
  cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Ustawienia kalendarza'

field:
  dayStart:
    label: 'Początek dnia'
  dayEnd:
    label: 'Koniec dnia'
  timeInterval:
    label: 'Przedział czasu'
    hint: 'Minuty na przedział'
  showAllTranslations:
    label: 'Pokaż wszystkie tłumaczenia'
  browseOutsideEventDates:
    label: 'Zezwól na przeglądanie poza datami obozu'

actions:
  save: 'Zapisz'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Nastavení kalendáře'

field:
  dayStart:
    label: 'Začátek dne'
  dayEnd:
    label: 'Konec dne'
  timeInterval:
    label: 'Časový interval'
    hint: 'Minut na interval'
  showAllTranslations:
    label: 'Zobrazit všechny překlady'
  browseOutsideEventDates:
    label: 'Povolit procházení mimo termíny tábora'

actions:
  save: 'Uložit'
  cancel: 'Zrušit'
</i18n>

<style lang="scss">
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
