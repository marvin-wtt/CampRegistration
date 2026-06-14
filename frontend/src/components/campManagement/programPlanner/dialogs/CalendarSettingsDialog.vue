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
          <q-input
            v-model="data.dayStart"
            :label="t('field.dayStart.label')"
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
                  <q-time
                    v-model="data.dayStart"
                    format24h
                  >
                    <div class="row items-center justify-end">
                      <q-btn
                        v-close-popup
                        :label="t('actions.close')"
                        color="primary"
                        flat
                        rounded
                        unelevated
                      />
                    </div>
                  </q-time>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <!-- Day end -->
          <q-input
            v-model="data.dayEnd"
            :label="t('field.dayEnd.label')"
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
                  <q-time
                    v-model="data.dayEnd"
                    format24h
                  >
                    <div class="row items-center justify-end">
                      <q-btn
                        v-close-popup
                        :label="t('actions.close')"
                        color="primary"
                        flat
                        rounded
                        unelevated
                      />
                    </div>
                  </q-time>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <!-- Show all translations -->
          <q-toggle
            v-model="data.showAllTranslations"
            :label="t('field.showAllTranslations.label')"
          />
        </q-card-section>

        <!-- action buttons -->
        <q-card-actions align="right">
          <q-btn
            :label="t('actions.cancel')"
            type="reset"
            color="primary"
            outline
            rounded
            unelevated
          />
          <q-btn
            :label="t('actions.save')"
            type="submit"
            color="primary"
            rounded
            unelevated
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
import type { CalendarSettings } from 'components/campManagement/programPlanner/CalendarSettings';

const { settings } = defineProps<{
  settings: Partial<CalendarSettings>;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const data = reactive<Partial<CalendarSettings>>(initialValue());

function initialValue(): Partial<CalendarSettings> {
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

actions:
  save: 'Save'
  cancel: 'Cancel'
  close: 'Close'
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

actions:
  save: 'Speichern'
  cancel: 'Abbrechen'
  close: 'Schließen'
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

actions:
  save: 'Enregistrer'
  cancel: 'Annuler'
  close: 'Fermer'
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

actions:
  save: 'Zapisz'
  cancel: 'Anuluj'
  close: 'Zamknij'
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

actions:
  save: 'Uložit'
  cancel: 'Zrušit'
  close: 'Zavřít'
</i18n>

<style lang="scss">
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
