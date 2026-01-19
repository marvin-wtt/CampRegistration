<template>
  <q-card flat>
    <q-form @submit="onSave">
      <q-card-section class="text-h4 text-negative">
        {{ t('title') }}
      </q-card-section>

      <q-card-section>
        <p>{{ t('disclaimer.description') }}</p>
        <ul>
          <li>{{ t('disclaimer.dataRemoval') }}</li>
          <li>{{ t('disclaimer.accessLoss') }}</li>
          <li>{{ t('disclaimer.collaborationImpact') }}</li>
          <li>{{ t('disclaimer.campDeletion') }}</li>
          <li>
            <strong>{{ t('disclaimer.irreversible') }}</strong>
          </li>
        </ul>
      </q-card-section>

      <q-card-actions>
        <q-btn
          :label="t('action.delete')"
          type="submit"
          color="negative"
          outlined
          rounded
        />
      </q-card-actions>
    </q-form>
  </q-card>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'delete'): void;
}>();

function onSave() {
  emit('delete');
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Delete account'

disclaimer:
  title: 'Delete Your Account'
  description: 'Deleting your account is a permanent action and cannot be undone. Please review the following before proceeding:'
  dataRemoval: 'All your personal information, settings, and associated data will be permanently deleted.'
  accessLoss: 'You will lose access to all camps, tools, and services associated with your account.'
  collaborationImpact: 'Collaborators may no longer see your contributions.'
  campDeletion: 'Camps that you created may be permanently deleted if no other users are associated with them.'
  irreversible: 'This action is irreversible.'

action:
  delete: 'Delete account'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Konto löschen'

disclaimer:
  title: 'Ihr Konto löschen'
  description: 'Das Löschen Ihres Kontos ist eine dauerhafte Aktion und kann nicht rückgängig gemacht werden. Bitte prüfen Sie Folgendes, bevor Sie fortfahren:'
  dataRemoval: 'Alle Ihre persönlichen Informationen, Einstellungen und zugehörigen Daten werden dauerhaft gelöscht.'
  accessLoss: 'Sie verlieren den Zugriff auf alle Camps, Tools und Dienste, die mit Ihrem Konto verbunden sind.'
  collaborationImpact: 'Mitarbeiter können Ihre Beiträge möglicherweise nicht mehr sehen.'
  campDeletion: 'Von Ihnen erstellte Camps könnten dauerhaft gelöscht werden, wenn keine anderen Benutzer damit verbunden sind.'
  irreversible: 'Diese Aktion ist endgültig.'

action:
  delete: 'Konto löschen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Supprimer le compte'

disclaimer:
  title: 'Supprimer votre compte'
  description: 'La suppression de votre compte est une action permanente et ne peut pas être annulée. Veuillez examiner les points suivants avant de continuer :'
  dataRemoval: 'Toutes vos informations personnelles, paramètres et données associées seront définitivement supprimés.'
  accessLoss: 'Vous perdrez l’accès à tous les camps, outils et services associés à votre compte.'
  collaborationImpact: 'Les collaborateurs pourraient ne plus voir vos contributions.'
  campDeletion: 'Les camps que vous avez créés pourraient être supprimés définitivement s’ils ne sont associés à aucun autre utilisateur.'
  irreversible: 'Cette action est irréversible.'

action:
  delete: 'Supprimer le compte'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Usuń konto'

disclaimer:
  title: 'Usunięcie konta'
  description: 'Usunięcie konta jest działaniem trwałym i nieodwracalnym. Przed kontynuowaniem zapoznaj się z poniższymi informacjami:'
  dataRemoval: 'Wszystkie Twoje dane osobowe, ustawienia i powiązane informacje zostaną trwale usunięte.'
  accessLoss: 'Utracisz dostęp do wszystkich obozów, narzędzi i usług powiązanych z Twoim kontem.'
  collaborationImpact: 'Inni współpracownicy mogą nie mieć już dostępu do Twoich treści.'
  campDeletion: 'Obozy utworzone przez Ciebie mogą zostać trwale usunięte, jeśli nie są powiązane z innymi użytkownikami.'
  irreversible: 'Ta operacja jest ostateczna.'

action:
  delete: 'Usuń konto'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Smazat účet'

disclaimer:
  title: 'Smazání účtu'
  description: 'Smazání vašeho účtu je trvalý a nevratný krok. Před pokračováním si prosím přečtěte následující:'
  dataRemoval: 'Všechny vaše osobní údaje, nastavení a související data budou trvale odstraněny.'
  accessLoss: 'Ztratíte přístup ke všem táborům, nástrojům a službám spojeným s vaším účtem.'
  collaborationImpact: 'Spolupracovníci již nemusí mít přístup k vašim příspěvkům.'
  campDeletion: 'Tábory, které jste vytvořili, mohou být trvale smazány, pokud nejsou spojeny s jinými uživateli.'
  irreversible: 'Tato akce je nevratná.'

action:
  delete: 'Smazat účet'
</i18n>
