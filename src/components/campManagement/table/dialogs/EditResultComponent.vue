<template>
  <q-dialog
    ref="dialogRef"
    persistent
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
              <!-- TODO required, visible, readonly -->
              <dynamic-input
                v-for="element in page.elements"
                :key="element.name"
                v-model="data[element.name]"
                :element="element"
                :data="data"
              />
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
          rounded
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('action.edit')"
          :loading="loading"
          color="primary"
          rounded
          @click="onOKClick"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { SurveyJSCampData } from 'src/types/SurveyJSCampData';
import { reactive, ref, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { useRegistrationsStore } from 'stores/registration-store';
import DynamicInput from 'components/inputs/DynamicInput.vue';

interface Props {
  questions: SurveyJSCampData;
  result: unknown;
}

const props = defineProps<Props>();
defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { to } = useObjectTranslation();
const registrationStore = useRegistrationsStore();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*...*/ }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

const loading = ref<boolean>(false);
const data = reactive(structuredClone(toRaw(props.result)) ?? {});

async function onOKClick() {
  const result = props.result;

  loading.value = true;
  const id = isIdentifiable(result) ? result.id : undefined;
  await registrationStore.updateData(id, toRaw(data));

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
