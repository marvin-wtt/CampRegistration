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
        <q-card-section class="text-h6">
          {{ t(`title`) }}
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-sm column">
          <translated-input
            v-model="modifiedRoom.name"
            :label="t('fields.name.label')"
            :rules="[
              (val: string | Record<string, string> | undefined) =>
                !!val || t('fields.name.rules.required'),
            ]"
            outlined
            rounded
            :locales="props.locales"
          />
        </q-card-section>

        <!-- action buttons -->
        <q-card-actions align="right">
          <q-btn
            type="reset"
            outline
            rounded
            color="primary"
            :label="t('action.cancel')"
          />
          <q-btn
            type="submit"
            rounded
            color="primary"
            :label="t('action.save')"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { reactive } from 'vue';
import type { Room, Translatable } from '@camp-registration/common/entities';
import TranslatedInput from 'components/common/inputs/TranslatedInput.vue';

const props = defineProps<{
  room: Room;
  locales?: string[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const modifiedRoom = reactive<{ name: Translatable }>({
  name: props.room.name,
});

function onOKClick(): void {
  onDialogOK(modifiedRoom);
}

function onCancelClick() {
  onDialogCancel();
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Edit room'

fields:
  name:
    label: 'Name'
    rules:
      required: 'Name is required'

action:
  save: 'Save'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zimmer bearbeiten'
fields:
  name:
    label: 'Name'
    rules:
      required: 'Name ist erforderlich'

action:
  save: 'Speichern'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Modifier la chambre'
fields:
  name:
    label: 'Nom'
    rules:
      required: 'Le nom est requis'

action:
  save: 'Enregistrer'
  cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Edytuj pokój'
fields:
  name:
    label: 'Nazwa'
    rules:
      required: 'Nazwa jest wymagana'

action:
  save: 'Zapisz'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Upravit pokoj'
fields:
  name:
    label: 'Název'
    rules:
      required: 'Název je povinný'

action:
  save: 'Uložit'
  cancel: 'Zrušit'
</i18n>
