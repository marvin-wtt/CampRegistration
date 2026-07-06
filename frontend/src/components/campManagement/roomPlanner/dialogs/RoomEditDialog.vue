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

          <q-input
            v-model.number="modifiedRoom.capacity"
            type="number"
            :label="t('fields.capacity.label')"
            :hint="t('fields.capacity.hint')"
            :rules="[
              (val: number | undefined) =>
                !!val || t('fields.capacity.rules.required'),
              (val: number) => val > 0 || t('fields.capacity.rules.positive'),
              (val: number) =>
                val >= props.minCapacity ||
                t('fields.capacity.rules.min', { min: props.minCapacity }),
            ]"
            outlined
            rounded
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
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';

const props = defineProps<{
  room: Pick<Room, 'name'>;
  capacity: number;
  minCapacity: number;
  locales?: string[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const modifiedRoom = reactive<{ name: Translatable; capacity: number }>({
  name: props.room.name,
  capacity: props.capacity,
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
  capacity:
    label: 'Number of beds'
    hint: 'Only empty beds can be removed'
    rules:
      required: 'Beds is required'
      positive: 'Room must have at least one bed'
      min: 'At least {min} beds are occupied'

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
  capacity:
    label: 'Anzahl der Betten'
    hint: 'Nur freie Betten können entfernt werden'
    rules:
      required: 'Betten sind erforderlich'
      positive: 'Zimmer muss mindestens ein Bett haben'
      min: 'Mindestens {min} Betten sind belegt'

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
  capacity:
    label: 'Nombre de lits'
    hint: 'Seuls les lits libres peuvent être supprimés'
    rules:
      required: 'Le nombre de lits est requis'
      positive: 'La chambre doit avoir au moins un lit'
      min: 'Au moins {min} lits sont occupés'

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
  capacity:
    label: 'Liczba łóżek'
    hint: 'Można usunąć tylko wolne łóżka'
    rules:
      required: 'Liczba łóżek jest wymagana'
      positive: 'Pokój musi mieć co najmniej jedno łóżko'
      min: 'Co najmniej {min} łóżek jest zajętych'

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
  capacity:
    label: 'Počet lůžek'
    hint: 'Odstranit lze pouze volná lůžka'
    rules:
      required: 'Počet lůžek je povinný'
      positive: 'Pokoj musí mít alespoň jedno lůžko'
      min: 'Alespoň {min} lůžek je obsazeno'

action:
  save: 'Uložit'
  cancel: 'Zrušit'
</i18n>
