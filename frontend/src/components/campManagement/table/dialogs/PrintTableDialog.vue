<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section class="q-dialog__title">
        {{ t('title') }}
      </q-card-section>

      <q-card-section class="q-dialog__message">
        {{ t('message') }}
      </q-card-section>

      <q-separator />

      <q-card-section class="q-dialog-plugin__form">
        <q-option-group
          v-model="model"
          :options
          type="checkbox"
          color="primary"
        />
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          :label="t('action.cancel')"
          color="primary"
          rounded
          outline
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('action.ok')"
          :disable="model.length === 0"
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
import type { TableTemplate } from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { useObjectTranslation } from 'src/composables/objectTranslation';

const { templates } = defineProps<{
  templates: Pick<TableTemplate, 'title' | 'id' | 'order'>[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { to } = useObjectTranslation();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const model = ref<string[]>([]);

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
