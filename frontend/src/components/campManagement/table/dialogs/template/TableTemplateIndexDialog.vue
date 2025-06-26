<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none">
      <q-card-section class="text-h6">
        {{ t('title') }}
      </q-card-section>

      <q-card-section class="q-pt-none">
        <sortable-list
          v-slot="slotProps"
          v-model="modifiedTemplates"
          :addable="can('camp.table_templates.create')"
          :editable="can('camp.table_templates.edit')"
          :sortable="can('camp.table_templates.edit')"
          :deletable="can('camp.table_templates.delete')"
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
import { ref, toRaw } from 'vue';
import { usePermissions } from 'src/composables/permissions';
import { deepToRaw } from 'src/utils/deepToRaw';

const { camp, templates } = defineProps<{
  templates: TableTemplate[];
  camp: Camp;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const quasar = useQuasar();
const { t } = useI18n();
const { to } = useObjectTranslation();
const { can } = usePermissions();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const modifiedTemplates = ref<TableTemplate[]>(propTemplates());

function propTemplates(): TableTemplate[] {
  // Filter generated templates as they cannot be edited and remove vue proxies
  const val = templates
    .filter((template) => template.generated !== true)
    .map(toRaw);

  return structuredClone(deepToRaw(val));
}

function addTemplate() {
  const template: TableTemplate = {
    id: 'filled-by-server',
    title: t('defaults.title'),
    order: modifiedTemplates.value.length,
    indexed: true,
    actions: true,
    columns: [],
  };
  quasar
    .dialog({
      component: TableTemplateEditDialog,
      componentProps: {
        template,
        camp,
      },
    })
    .onOk((payload) => {
      modifiedTemplates.value.push(payload);
    });
}

function editTemplate(template: TableTemplate) {
  quasar
    .dialog({
      component: TableTemplateEditDialog,
      componentProps: {
        template,
        camp,
      },
      persistent: true,
    })
    .onOk((payload) => {
      const index = modifiedTemplates.value.indexOf(template);

      if (index < 0) {
        return;
      }

      modifiedTemplates.value[index] = payload;
    });
}

function onOKClick() {
  onDialogOK(modifiedTemplates.value);
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
