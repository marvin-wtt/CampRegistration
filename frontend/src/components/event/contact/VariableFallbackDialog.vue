<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="label"
      icon="data_object"
      :width="480"
      @submit="onDialogOK(fallback.trim() || null)"
      @cancel="onDialogCancel"
    >
      <q-input
        v-model="fallback"
        :label="t('input.label')"
        :hint="t('input.hint')"
        :rules="[
          (val: string) =>
            cleanFallback(val) === val.trim() || t('input.rule.characters'),
        ]"
        :autofocus="!quasar.screen.lt.sm"
        outlined
        rounded
      />

      <template #actions>
        <m-btn
          type="reset"
          primary
          text
          :label="t('action.cancel')"
        />
        <m-btn
          type="submit"
          primary
          :label="t('action.ok')"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import { cleanFallback } from './VariableNode';

const quasar = useQuasar();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();

const props = defineProps<{
  label: string;
  fallback: string | null;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const fallback = ref(props.fallback ?? '');
</script>

<i18n lang="yaml" locale="en">
input:
  label: 'Fallback'
  hint: 'Shown when the registration has no value here. Leave empty to show nothing.'
  rule:
    characters: 'Braces and angle brackets aren’t allowed'
action:
  cancel: 'Cancel'
  ok: 'Save'
</i18n>

<i18n lang="yaml" locale="de">
input:
  label: 'Ersatztext'
  hint: 'Wird angezeigt, wenn die Anmeldung hier keinen Wert hat. Leer lassen, um nichts anzuzeigen.'
  rule:
    characters: 'Geschweifte und spitze Klammern sind nicht erlaubt'
action:
  cancel: 'Abbrechen'
  ok: 'Speichern'
</i18n>

<i18n lang="yaml" locale="fr">
input:
  label: 'Texte de remplacement'
  hint: "Affiché lorsque l'inscription n'a pas de valeur ici. Laissez vide pour ne rien afficher."
  rule:
    characters: 'Les accolades et chevrons ne sont pas autorisés'
action:
  cancel: 'Annuler'
  ok: 'Enregistrer'
</i18n>

<i18n lang="yaml" locale="pl">
input:
  label: 'Tekst zastępczy'
  hint: 'Wyświetlany, gdy zgłoszenie nie ma tu wartości. Pozostaw puste, aby nic nie wyświetlać.'
  rule:
    characters: 'Nawiasy klamrowe i ostre nie są dozwolone'
action:
  cancel: 'Anuluj'
  ok: 'Zapisz'
</i18n>

<i18n lang="yaml" locale="cs">
input:
  label: 'Náhradní text'
  hint: 'Zobrazí se, když registrace nemá žádnou hodnotu. Ponechte prázdné, aby se nezobrazilo nic.'
  rule:
    characters: 'Složené a lomené závorky nejsou povoleny'
action:
  cancel: 'Zrušit'
  ok: 'Uložit'
</i18n>
