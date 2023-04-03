<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">
          {{ t('title') }}
        </div>
      </q-card-section>

      <q-list
        bordered
        class="rounded-borders scroll"
        style="max-height: 75vh"
      >
        <q-expansion-item
          v-for="page in props.questions.pages"
          :key="page.name"
          :label="to(page.title)"
          group="questions"
        >
          <q-card>
            <q-card-section>
              <div
                v-for="element in page.elements"
                :key="element.name"
                class="q-gutter-y-md column"
              >
                <q-input
                  v-if="element.type === 'text'"
                  v-model="data[element.name]"
                  :hint="to(element.description)"
                  :label="to(element.title)"
                  hide-bottom-space
                />

                <q-input
                  v-else-if="element.type === 'comment'"
                  v-model="data[element.name]"
                  :hint="to(element.description)"
                  :label="to(element.title)"
                  type="textarea"
                />

                <q-checkbox
                  v-else-if="element.type === 'checkbox'"
                  v-model="data[element.name]"
                  :false-value="data[element.name] == null ? null : false"
                  :hint="to(element.description)"
                  :label="to(element.title)"
                />

                <!-- TODO hint -->
                <q-toggle
                  v-else-if="element.type === 'boolean'"
                  v-model="data[element.name]"
                  :label="to(element.title)"
                />

                <div
                  v-else-if="element.type === 'radiogroup'"
                  class="q-py-md"
                >
                  <p>
                    {{ to(element.title) }}
                  </p>

                  <q-radio
                    v-for="choice in element.choices"
                    :key="choice.value"
                    v-model="data[element.name]"
                    :label="to(choice.text)"
                    :val="choice.value"
                    color="primary"
                    inline
                  />

                  <p class="text-caption">
                    {{ to(element.description) }}
                  </p>
                </div>

                <q-select
                  v-else-if="element.type === 'dropdown'"
                  v-model="data[element.name]"
                  :hint="to(element.description)"
                  :label="to(element.title)"
                  :option-label="(option) => to(option.text)"
                  :options="element.choices"
                  emit-value
                  map-options
                />

                <!-- TODO Ajust size -->
                <div v-else-if="element.type === 'expression'">
                  <b>
                    {{ to(element.title) }}
                  </b>
                  <p class="text-caption">
                    {{ to(element.description) }}
                  </p>
                </div>

                <!-- TODO add uploader -->

                <p
                  v-else
                  class="text-negative"
                >
                  Unknown element: {{ element.type }}
                </p>
              </div>
            </q-card-section>
          </q-card>
          <q-separator />
        </q-expansion-item>
      </q-list>

      <q-card-actions align="right">
        <q-btn
          :disable="loading"
          :label="t('action.cancel')"
          flat
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('action.edit')"
          :loading="loading"
          color="primary"
          @click="onOKClick"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { SurveyJSCampData } from 'src/types/SurveyJSCampData';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { useCampRegistrationsStore } from 'stores/camp/camp-registration-store';

interface Props {
  questions: SurveyJSCampData;
  result: unknown;
}

const props = defineProps<Props>();
defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { to } = useObjectTranslation();
const registrationStore = useCampRegistrationsStore();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*...*/ }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

const loading = ref<boolean>(false);
const data = reactive(props.result ?? {});

async function onOKClick() {
  const result = props.result;

  loading.value = true;
  const id = isIdentifiable(result) ? result.id : undefined;
  await registrationStore.updateData(id, data);

  onDialogOK();
}

function isObject(value: unknown): value is object {
  return value != null && typeof value === 'object';
}

function isIdentifiable(value: unknown): value is { id: string } {
  return isObject(value) && 'id' in value && typeof value.id === 'string';
}
</script>

<i18n lang="yaml" locale="en">
title: 'Edit data'
action:
  edit: 'Save'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Daten bearbeiten'
action:
  edit: 'Speichern'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modifier les données'
action:
  edit: 'Sauvegarder'
  cancel: 'Annuler'
</i18n>

<style></style>
