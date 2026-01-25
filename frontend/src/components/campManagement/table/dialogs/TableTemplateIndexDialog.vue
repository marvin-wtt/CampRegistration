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
          :label="t('action.cancel')"
          outline
          rounded
          @click="onDialogCancel"
        />
        <q-btn
          color="primary"
          :label="t('action.ok')"
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
import TableTemplateEditDialog from 'components/campManagement/table/dialogs/TableTemplateEditDialog.vue';
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
    title: t('default.title'),
    order: modifiedTemplates.value.length,
    indexed: true,
    actions: true,
    sortBy: 'first_name',
    filterStatus: ['ACCEPTED'],
    columns: [
      {
        label: {
          en: 'First Name',
          de: 'Vorname',
          fr: 'Prénom',
        },
        name: 'first_name',
        field: 'computedData.firstName',
        align: 'left',
        renderAs: 'name',
        sortable: true,
      },
      {
        label: {
          en: 'Last Name',
          de: 'Nachname',
          fr: 'Nom de famille',
        },
        name: 'last_name',
        field: 'computedData.lastName',
        align: 'left',
        renderAs: 'name',
        sortable: true,
      },
    ],
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

action:
  ok: 'Ok'
  cancel: 'Cancel'

default:
  title: 'New template'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Vorlagen bearbeiten'

action:
  ok: 'Ok'
  cancel: 'Abbrechen'

default:
  title: 'Neue Vorlage'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modifier le modèle'

action:
  ok: 'Ok'
  cancel: 'Annuler'

default:
  title: 'Nouveau modèle'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Edytuj szablony'

action:
  ok: 'OK'
  cancel: 'Anuluj'

default:
  title: 'Nowy szablon'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Upravit šablony'

action:
  ok: 'OK'
  cancel: 'Zrušit'

default:
  title: 'Nová šablona'
</i18n>
