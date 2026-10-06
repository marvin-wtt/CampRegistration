<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('title')"
      :subtitle="t('message')"
      :width="480"
      @submit="onOKClick"
      @cancel="onDialogCancel"
    >
      <q-option-group
        v-model="model"
        :options
        type="checkbox"
        color="primary"
      />

      <template #actions>
        <q-btn
          type="reset"
          :label="t('action.cancel')"
          color="primary"
          rounded
          outline
        />
        <q-btn
          type="submit"
          :label="t('action.ok')"
          :disable="model.length === 0"
          color="primary"
          rounded
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import type { TableTemplate } from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { useObjectTranslation } from '@/composables/objectTranslation';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';

type SimpleTableTemplate = Pick<TableTemplate, 'title' | 'id' | 'order'>;

const { templates, defaultTemplateId } = defineProps<{
  templates: SimpleTableTemplate[];
  defaultTemplateId?: string | undefined;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { to } = useObjectTranslation();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const model = ref<string[]>(defaultTemplateId ? [defaultTemplateId] : []);

const options = computed(() =>
  templates.map((template) => ({
    label: to(template.title),
    value: template.id,
  })),
);

function onOKClick() {
  onDialogOK(model.value);
}
</script>

<i18n lang="yaml" locale="en">
title: 'Print Table'
message: 'Select the tables you want to print:'

action:
  ok: 'Print'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Tabelle drucken'
message: 'Wähle die Tabellen aus, die du drucken möchtest:'

action:
  ok: 'Drucken'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Imprimer le tableau'
message: 'Sélectionnez les tableaux que vous souhaitez imprimer :'

action:
  ok: 'Imprimer'
  cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Drukuj tabelę'
message: 'Wybierz tabele, które chcesz wydrukować:'

action:
  ok: 'Drukuj'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Tisk tabulky'
message: 'Vyberte tabulky, které chcete vytisknout:'

action:
  ok: 'Tisknout'
  cancel: 'Zrušit'
</i18n>
