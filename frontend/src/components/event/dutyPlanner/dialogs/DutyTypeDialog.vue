<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none">
      <q-form
        @submit="onOKClick"
        @reset="onDialogCancel"
      >
        <q-card-section>
          <div class="text-h5 text-center">
            {{ isEdit ? t('title.edit') : t('title.create') }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-sm column">
          <translated-input
            v-model="data.name"
            :label="t('field.name.label')"
            :rules="[
              (val: string | Record<string, string> | undefined) =>
                !!val || t('field.name.rule.required'),
            ]"
            :locales="locales"
            hide-bottom-space
            autofocus
            outlined
            rounded
          >
            <template #prepend>
              <q-icon name="checklist" />
            </template>
          </translated-input>

          <div>
            <div class="text-caption text-grey-7 q-mb-xs">
              {{ t('field.rotationUnit.label') }}
            </div>
            <q-option-group
              v-model="data.rotationUnit"
              :options="rotationUnitOptions"
              color="primary"
            />
            <div class="text-caption text-grey-6">
              {{ t(`field.rotationUnit.hint.${data.rotationUnit}`) }}
            </div>
          </div>

          <q-input
            v-if="data.rotationUnit === 'PARTICIPANT'"
            v-model.number="data.defaultCount"
            type="number"
            min="1"
            clearable
            :label="t('field.defaultCount.label')"
            :hint="t('field.defaultCount.hint')"
            outlined
            rounded
            @update:model-value="normalizeDefaultCount"
          >
            <template #prepend>
              <q-icon name="groups" />
            </template>
          </q-input>
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
            :label="isEdit ? t('action.save') : t('action.create')"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, reactive, watch } from 'vue';
import type {
  Duty,
  DutyCreateData,
  DutyRotationUnit,
  DutyUpdateData,
} from '@camp-registration/common/entities';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const props = defineProps<{
  duty?: Duty;
  locales?: string[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const isEdit = computed<boolean>(() => props.duty !== undefined);

const data = reactive<DutyCreateData>({
  name: props.duty?.name ?? '',
  rotationUnit: props.duty?.rotationUnit ?? 'PARTICIPANT',
  defaultCount: props.duty?.defaultCount ?? null,
});

// defaultCount only applies to PARTICIPANT rotation — drop a stale value when
// switching away so it can't be submitted for a ROOM duty.
watch(
  () => data.rotationUnit,
  (unit) => {
    if (unit === 'ROOM') {
      data.defaultCount = null;
    }
  },
);

function normalizeDefaultCount(value: string | number | null) {
  const num = typeof value === 'string' ? Number(value) : value;
  data.defaultCount = num && num > 0 ? Math.floor(num) : null;
}

const rotationUnitOptions = computed<
  { label: string; value: DutyRotationUnit }[]
>(() => [
  { label: t('field.rotationUnit.option.PARTICIPANT'), value: 'PARTICIPANT' },
  { label: t('field.rotationUnit.option.ROOM'), value: 'ROOM' },
]);

function onOKClick(): void {
  const payload: DutyCreateData | DutyUpdateData = { ...data };

  onDialogOK(payload);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title:
  create: 'Add duty type'
  edit: 'Edit duty type'

field:
  name:
    label: 'Name'
    rule:
      required: 'The name is required'
  rotationUnit:
    label: 'Rotates by'
    option:
      PARTICIPANT: 'Participant'
      ROOM: 'Room'
    hint:
      PARTICIPANT: 'Suggestions pick individual participants who are next in line.'
      ROOM: 'Suggestions pick whole rooms who are next in line.'
  defaultCount:
    label: 'Usual party size'
    hint: "Optional — how many people this duty usually needs. It's a starting suggestion, not a limit."

action:
  cancel: 'Cancel'
  create: 'Create'
  save: 'Save'
</i18n>

<i18n lang="yaml" locale="de">
title:
  create: 'Dienst hinzufügen'
  edit: 'Dienst bearbeiten'

field:
  name:
    label: 'Name'
    rule:
      required: 'Der Name ist erforderlich'
  rotationUnit:
    label: 'Rotiert nach'
    option:
      PARTICIPANT: 'Teilnehmenden'
      ROOM: 'Zimmern'
    hint:
      PARTICIPANT: 'Vorschläge wählen einzelne Teilnehmende aus, die als Nächstes an der Reihe sind.'
      ROOM: 'Vorschläge wählen ganze Zimmer aus, die als Nächstes an der Reihe sind.'
  defaultCount:
    label: 'Übliche Gruppengröße'
    hint: 'Optional — wie viele Personen dieser Dienst normalerweise braucht. Das ist ein Vorschlag, kein Limit.'

action:
  cancel: 'Abbrechen'
  create: 'Erstellen'
  save: 'Speichern'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  create: 'Ajouter un type de corvée'
  edit: 'Modifier le type de corvée'

field:
  name:
    label: 'Nom'
    rule:
      required: 'Le nom est requis'
  rotationUnit:
    label: 'Rotation par'
    option:
      PARTICIPANT: 'Participant'
      ROOM: 'Chambre'
    hint:
      PARTICIPANT: 'Les suggestions proposent des participants individuels dont c’est le tour.'
      ROOM: 'Les suggestions proposent des chambres entières dont c’est le tour.'
  defaultCount:
    label: 'Taille habituelle du groupe'
    hint: "Facultatif — combien de personnes cette corvée nécessite habituellement. C'est une suggestion de départ, pas une limite."

action:
  cancel: 'Annuler'
  create: 'Créer'
  save: 'Enregistrer'
</i18n>

<i18n lang="yaml" locale="pl">
title:
  create: 'Dodaj rodzaj dyżuru'
  edit: 'Edytuj rodzaj dyżuru'

field:
  name:
    label: 'Nazwa'
    rule:
      required: 'Nazwa jest wymagana'
  rotationUnit:
    label: 'Rotacja według'
    option:
      PARTICIPANT: 'Uczestnika'
      ROOM: 'Pokoju'
    hint:
      PARTICIPANT: 'Sugestie wskazują pojedynczych uczestników, których kolej nadeszła.'
      ROOM: 'Sugestie wskazują całe pokoje, których kolej nadeszła.'
  defaultCount:
    label: 'Zwykła liczebność grupy'
    hint: 'Opcjonalne — ile osób zwykle potrzeba do tego dyżuru. To tylko sugestia początkowa, nie limit.'

action:
  cancel: 'Anuluj'
  create: 'Utwórz'
  save: 'Zapisz'
</i18n>

<i18n lang="yaml" locale="cs">
title:
  create: 'Přidat typ služby'
  edit: 'Upravit typ služby'

field:
  name:
    label: 'Název'
    rule:
      required: 'Název je povinný'
  rotationUnit:
    label: 'Rotace podle'
    option:
      PARTICIPANT: 'Účastníka'
      ROOM: 'Pokoje'
    hint:
      PARTICIPANT: 'Návrhy vybírají jednotlivé účastníky, kteří jsou na řadě.'
      ROOM: 'Návrhy vybírají celé pokoje, které jsou na řadě.'
  defaultCount:
    label: 'Obvyklá velikost skupiny'
    hint: 'Volitelné — kolik lidí tato služba obvykle potřebuje. Jde jen o výchozí návrh, ne o limit.'

action:
  cancel: 'Zrušit'
  create: 'Vytvořit'
  save: 'Uložit'
</i18n>
