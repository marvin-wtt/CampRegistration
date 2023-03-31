<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none">
      <q-card-section>
        <div class="text-h6">
          {{ t('title') }}
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <sortable-list
          v-model="templates"
          addable
          editable
          deletable
          bordered
          separator
          @on-edit="(item) => editTemplate(item)"
          v-slot="slotProps"
        >
          <q-item-section>
            {{ to(slotProps.item.title) }}
          </q-item-section>
        </sortable-list>
      </q-card-section>

      <!-- buttons example -->
      <q-card-actions align="right">
        <q-btn
          color="primary"
          :label="t('actions.cancel')"
          outline
          rounded
          @click="onDialogCancel"
        />
        <q-btn
          color="primary"
          :label="t('actions.ok')"
          rounded
          @click="onOKClick"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { TableTemplate } from 'src/types/TableTemplate';
import EditResultTemplateDialog from 'components/results/dialogs/template/EditResultTemplateDialog.vue';
import SortableList from 'components/SortableList.vue';
import { reactive } from 'vue';
import { Camp } from 'src/types/Camp';

interface Props {
  templates: TableTemplate[];
  camp: Camp;
}

const props = defineProps<Props>();

defineEmits([...useDialogPluginComponent.emits]);

const quasar = useQuasar();
const { t } = useI18n();
const { to } = useObjectTranslation();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*...*/ }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

const templates = reactive<TableTemplate[]>(props.templates);

function editTemplate(template: TableTemplate) {
  quasar
    .dialog({
      component: EditResultTemplateDialog,
      componentProps: {
        template: template,
        camp: props.camp,
      },
      persistent: true,
    })
    .onOk((payload) => {
      // TODO
    });
}

function onOKClick() {
  // TODO
  onDialogOK();
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Edit Templated'

actions:
  ok: 'Ok'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Vorlagen bearbeiten'

actions:
  ok: 'Ok'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modifier le modèle'
actions:
  ok: 'Ok'
  cancel: 'Annuler'
</i18n>
