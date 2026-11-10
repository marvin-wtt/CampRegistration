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
          :addable="can('event.table_templates.create')"
          :editable="can('event.table_templates.edit')"
          :sortable="can('event.table_templates.edit')"
          :deletable="can('event.table_templates.delete')"
          bordered
          separator
          @add="addTemplate"
          @edit="(item) => editTemplate(item)"
        >
          <q-item-section>
            {{ to(slotProps.item.title) }}
          </q-item-section>
          <q-item-section
            v-if="issueCount(slotProps.item) > 0"
            side
          >
            <q-icon
              name="warning"
              color="warning"
              :data-test="`template-issues-${slotProps.item.id}`"
            >
              <q-tooltip>
                {{ t('issues', issueCount(slotProps.item)) }}
              </q-tooltip>
            </q-icon>
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
import { useObjectTranslation } from '@/composables/objectTranslation';
import type {
  EventDetails,
  Registration,
  TableTemplate,
} from '@camp-registration/common/entities';
import TableTemplateEditDialog from '@/components/event/table/dialogs/TableTemplateEditDialog.vue';
import SortableList from '@/components/common/SortableList.vue';
import { computed, ref, toRaw } from 'vue';
import { TableTemplateReferenceChecker } from '@camp-registration/common/form';
import { usePermissions } from '@/composables/permissions';
import { deepToRaw } from '@/utils/deepToRaw';

const { event, templates, registrations } = defineProps<{
  templates: TableTemplate[];
  event: EventDetails;
  registrations?: Registration[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const quasar = useQuasar();
const { t } = useI18n();
const { to } = useObjectTranslation();
const { can } = usePermissions();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const checker = computed(
  () => new TableTemplateReferenceChecker(event.form, registrations),
);

function issueCount(template: TableTemplate): number {
  return checker.value.check(template).length;
}

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
        event,
        registrations,
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
        event,
        registrations,
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
title: 'Edit Tables'

action:
  ok: 'Ok'
  cancel: 'Cancel'

issues: 'One reference cannot be found in the form | {n} references cannot be found in the form'

default:
  title: 'New template'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Tabellen bearbeiten'

action:
  ok: 'Ok'
  cancel: 'Abbrechen'

issues: 'Ein Verweis fehlt im Formular | {n} Verweise fehlen im Formular'

default:
  title: 'Neue Vorlage'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modifier les tableaux'

action:
  ok: 'Ok'
  cancel: 'Annuler'

issues: 'Une référence est introuvable dans le formulaire | {n} références sont introuvables dans le formulaire'

default:
  title: 'Nouveau modèle'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Edytuj tabele'

action:
  ok: 'OK'
  cancel: 'Anuluj'

issues: 'W formularzu brakuje 1 odwołania | Brakujące odwołania w formularzu: {n}'

default:
  title: 'Nowy szablon'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Upravit tabulky'

action:
  ok: 'OK'
  cancel: 'Zrušit'

issues: 'Ve formuláři chybí 1 odkaz | Chybějící odkazy ve formuláři: {n}'

default:
  title: 'Nová šablona'
</i18n>
