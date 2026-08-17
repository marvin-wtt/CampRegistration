<template>
  <q-card
    flat
    class="danger-card"
  >
    <q-card-section class="row items-start no-wrap q-gutter-sm">
      <div class="danger-icon row items-center justify-center">
        <q-icon
          name="delete_forever"
          size="22px"
          class="text-error"
        />
      </div>

      <div class="col">
        <div class="text-subtitle2 text-weight-bold">{{ t('title') }}</div>
        <div class="text-body2 text-on-surface-variant q-mt-xs">
          {{ t('disclaimer.description') }}
        </div>
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <ul class="consequences text-body2 text-on-surface-variant">
        <li
          v-for="key in consequences"
          :key="key"
        >
          <q-icon
            name="remove"
            size="16px"
            class="consequences__bullet"
          />
          <span>{{ t(`disclaimer.${key}`) }}</span>
        </li>
      </ul>

      <div class="irreversible row items-center no-wrap q-gutter-xs">
        <q-icon
          name="error_outline"
          size="16px"
        />
        <span class="text-body2 text-weight-medium">
          {{ t('disclaimer.irreversible') }}
        </span>
      </div>
    </q-card-section>

    <q-card-actions class="q-pt-none q-px-md q-pb-md">
      <m-btn
        :label="t('action.delete')"
        icon="delete_forever"
        tonal
        error
        @click="emit('delete')"
      />
    </q-card-actions>
  </q-card>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'delete'): void;
}>();

const consequences = [
  'dataRemoval',
  'accessLoss',
  'collaborationImpact',
  'campDeletion',
] as const;
</script>

<style lang="scss" scoped>
// Danger zone treatment shared with OrganizationUnverifiedNotice: an error
// accent and a faint error tint, rather than a fully red card.
.danger-card {
  border-radius: 16px;
  border-left: 4px solid var(--md3-error);
  background: color-mix(in srgb, var(--md3-error) 6%, var(--md3-surface));
}

.danger-icon {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border-radius: 13px;
  background: color-mix(in srgb, var(--md3-error) 12%, transparent);
}

.consequences {
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }

  li + li {
    margin-top: 4px;
  }

  &__bullet {
    flex: 0 0 auto;
    margin-top: 2px;
    opacity: 0.6;
  }
}

.irreversible {
  margin-top: 12px;
  color: var(--md3-error);
}
</style>

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
