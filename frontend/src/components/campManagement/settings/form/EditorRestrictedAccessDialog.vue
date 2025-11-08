<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pb-none">
      <q-card-section>
        <div class="text-h6">
          {{ t('title') }}
        </div>
      </q-card-section>
      <q-card-section>
        {{ t('line1') }}
        <br />
        <br />
        {{ t('line2') }}
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          :label="t('action.cancel')"
          type="reset"
          color="warning"
          outline
          rounded
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('action.ok')"
          type="submit"
          color="primary"
          rounded
          @click="onDialogOK"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
</script>

<i18n lang="yaml" locale="en">
title: 'Restricted access'
line1: 'Registrations have already been submitted using the current form.
  Modifying the form may lead to data inconsistencies or affect existing
  submissions.'
line2: 'Would you like to proceed with restricted access, limiting
  form changes, or continue with full access to modify the form?'
action:
  ok: 'Restricted Access'
  cancel: 'Full access'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Eingeschränkter Zugriff'
line1: 'Es wurden bereits Anmeldungen mit dem aktuellen Formular eingereicht.
  Änderungen am Formular könnten zu Dateninkonsistenzen führen oder bestehende
  Einreichungen beeinträchtigen.'
line2: 'Möchtest du mit eingeschränktem Zugriff
  fortfahren, um Formularänderungen zu begrenzen, oder mit vollem Zugriff
  fortfahren, um das Formular zu ändern?'
action:
  ok: 'Eingeschränkter Zugriff'
  cancel: 'Voller Zugriff'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Accès restreint'
line1:
  'Des inscriptions ont déjà été soumises en utilisant le formulaire actuel.
  Modifier le formulaire peut entraîner des incohérences de données ou affecter
  les soumissions existantes.'
line2: 'Souhaitez-vous continuer avec un accès restreint,
  limitant les modifications du formulaire, ou poursuivre avec un accès complet
  pour le modifier ?'
action:
  ok: 'Accès restreint'
  cancel: 'Accès complet'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Ograniczony dostęp'
line1: 'Niektóre zgłoszenia zostały już przesłane za pomocą tego formularza. Zmiany w formularzu mogą spowodować niespójność danych lub wpłynąć na istniejące zgłoszenia.'
line2: 'Czy chcesz kontynuować z ograniczonym dostępem, aby ograniczyć zmiany w formularzu, czy kontynuować z pełnym dostępem, aby edytować formularz?'
action:
  ok: 'Ograniczony dostęp'
  cancel: 'Pełny dostęp'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Omezený přístup'
line1: 'Některé registrace již byly odeslány pomocí tohoto formuláře. Úpravy formuláře mohou způsobit nekonzistenci dat nebo ovlivnit stávající přihlášky.'
line2: 'Chcete pokračovat s omezeným přístupem, abyste omezili změny ve formuláři, nebo pokračovat s plným přístupem a formulář upravit?'
action:
  ok: 'Omezený přístup'
  cancel: 'Plný přístup'
</i18n>

<style scoped></style>
