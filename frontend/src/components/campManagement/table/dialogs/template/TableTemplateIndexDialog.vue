<template>
  <q-dialog
    ref="dialogRef"
    persistent
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
          v-slot="slotProps"
          v-model="modifiedTemplates"
          addable
          editable
          deletable
          bordered
          separator
          @add="addTemplate"
          @edit="(item) => editTemplate(item)"
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
import type { Camp, TableTemplate } from '@camp-registration/common/entities';
import TableTemplateEditDialog from 'components/campManagement/table/dialogs/template/TableTemplateEditDialog.vue';
import SortableList from 'components/common/SortableList.vue';
import { reactive, toRaw } from 'vue';

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

const modifiedTemplates = reactive<TableTemplate[]>(propTemplates());

function propTemplates(): TableTemplate[] {
  // Filter generated templates as they cannot be edited and remove vue proxies
  const templates = props.templates
    .filter((template) => {
      return template.generated !== true;
    })
    .map((template) => {
      return toRaw(template);
    });
  return structuredClone(templates) as TableTemplate[];
}

function addTemplate() {
  const template: TableTemplate = {
    id: 'filled-by-server',
    title: t('defaults.title'),
    order: modifiedTemplates.length,
    indexed: true,
    actions: true,
    columns: [],
  };
  quasar
    .dialog({
      component: TableTemplateEditDialog,
      componentProps: {
        template: template,
        camp: props.camp,
      },
    })
    .onOk((payload) => {
      modifiedTemplates.push(payload);
    });
}

function editTemplate(template: TableTemplate) {
  quasar
    .dialog({
      component: TableTemplateEditDialog,
      componentProps: {
        template: template,
        camp: props.camp,
      },
      persistent: true,
    })
    .onOk((payload) => {
      const index = modifiedTemplates.indexOf(template);

      if (index < 0) {
        return;
      }

      modifiedTemplates[index] = payload;
    });
}

function onOKClick() {
  onDialogOK(modifiedTemplates);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Edit Templated'

actions:
  ok: 'Ok'
  cancel: 'Cancel'

defaults:
  title: 'New template'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Vorlagen bearbeiten'

actions:
  ok: 'Ok'
  cancel: 'Abbrechen'

defaults:
  title: 'Neue Vorlage'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modifier le modèle'

actions:
  ok: 'Ok'
  cancel: 'Annuler'

defaults:
  title: 'Nouveau modèle'
</i18n>
