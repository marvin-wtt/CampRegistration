<template>
  <danger-card icon="delete_forever">
    <div class="text-subtitle2 text-weight-bold">{{ t('title') }}</div>
    <div class="text-body2 text-on-surface-variant q-mt-xs">
      {{ t('disclaimer.description') }}
    </div>

    <template #body>
      <div
        v-if="blocked"
        class="blockers rounded-md q-pa-md q-mb-md"
        data-test="account-deletion-blockers"
      >
        <div class="row items-center no-wrap q-gutter-xs">
          <q-icon
            name="block"
            size="18px"
          />
          <span class="text-body2 text-weight-medium">
            {{ t('blockers.title') }}
          </span>
        </div>
        <div class="text-body2 q-mt-xs">
          {{ t('blockers.description') }}
        </div>
        <ul class="blockers__list text-body2 q-mt-sm">
          <li
            v-for="blocker in blockers"
            :key="`${blocker.type}-${blocker.id}`"
          >
            <router-link :to="blockerRoute(blocker)">
              {{ blocker.type === 'event' ? to(blocker.name) : blocker.name }}
            </router-link>
            <span class="blockers__kind"
              >· {{ t(`blockers.${blocker.type}`) }}</span
            >
          </li>
        </ul>
      </div>

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
    </template>

    <template #actions>
      <m-btn
        :label="t('action.delete')"
        icon="delete_forever"
        tonal
        error
        :disable="blocked"
        data-test="account-delete"
        @click="emit('delete')"
      />
    </template>
  </danger-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AccountDeletionBlocker } from '@camp-registration/common/entities';
import type { RouteLocationRaw } from 'vue-router';
import DangerCard from '@/components/common/DangerCard.vue';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { useObjectTranslation } from '@/composables/objectTranslation';

const { t } = useI18n();
const { to } = useObjectTranslation();

// `null` while unknown; the server refuses a blocked deletion either way.
const { blockers } = defineProps<{
  blockers: AccountDeletionBlocker[] | null;
}>();

const emit = defineEmits<{
  (e: 'delete'): void;
}>();

const blocked = computed(() => !!blockers && blockers.length > 0);

function blockerRoute(blocker: AccountDeletionBlocker): RouteLocationRaw {
  switch (blocker.type) {
    case 'event':
      return {
        name: 'management.event.settings.access',
        params: { eventId: blocker.id },
      };
    case 'newsletter':
      return {
        name: 'management.newsletter',
        params: { newsletterId: blocker.id },
      };
    case 'organization':
      return {
        name: 'management.organization.members',
        params: { organizationId: blocker.id },
      };
  }
}

const consequences = [
  'dataRemoval',
  'accessLoss',
  'collaborationImpact',
  'auditRetention',
] as const;
</script>

<style lang="scss" scoped>
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

.blockers {
  background: var(--md3-warning-container);
  color: var(--md3-on-warning-container);

  &__list {
    margin: 0;
    padding-left: 20px;
  }

  &__kind {
    opacity: 0.7;
  }

  a {
    color: inherit;
    font-weight: 500;
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
  accessLoss: 'You will lose access to all events, tools, and services associated with your account.'
  collaborationImpact: 'Collaborators may no longer see your contributions.'
  auditRetention: 'Changes you made to events stay in their audit log, with your name, for up to two years.'
  irreversible: 'This action is irreversible.'

blockers:
  title: 'Your account cannot be deleted yet'
  description: 'You are the only director, owner or administrator of the following. Give another person that role or delete them first.'
  event: 'Event'
  newsletter: 'Newsletter'
  organization: 'Organization'

action:
  delete: 'Delete account'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Konto löschen'

disclaimer:
  title: 'Ihr Konto löschen'
  description: 'Das Löschen Ihres Kontos ist eine dauerhafte Aktion und kann nicht rückgängig gemacht werden. Bitte prüfen Sie Folgendes, bevor Sie fortfahren:'
  dataRemoval: 'Alle Ihre persönlichen Informationen, Einstellungen und zugehörigen Daten werden dauerhaft gelöscht.'
  accessLoss: 'Sie verlieren den Zugriff auf alle Veranstaltungen, Tools und Dienste, die mit Ihrem Konto verbunden sind.'
  collaborationImpact: 'Mitarbeiter können Ihre Beiträge möglicherweise nicht mehr sehen.'
  auditRetention: 'Ihre Änderungen an Veranstaltungen bleiben mit Ihrem Namen bis zu zwei Jahre im Änderungsprotokoll erhalten.'
  irreversible: 'Diese Aktion ist endgültig.'

blockers:
  title: 'Ihr Konto kann noch nicht gelöscht werden'
  description: 'Sie sind die einzige Person mit Leitungs-, Inhaber- bzw. Administrationsrolle für die folgenden Einträge. Übertragen Sie diese Rolle an eine andere Person oder löschen Sie die Einträge zuerst.'
  event: 'Veranstaltung'
  newsletter: 'Newsletter'
  organization: 'Organisation'

action:
  delete: 'Konto löschen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Supprimer le compte'

disclaimer:
  title: 'Supprimer votre compte'
  description: 'La suppression de votre compte est une action permanente et ne peut pas être annulée. Veuillez examiner les points suivants avant de continuer :'
  dataRemoval: 'Toutes vos informations personnelles, paramètres et données associées seront définitivement supprimés.'
  accessLoss: 'Vous perdrez l’accès à tous les événements, outils et services associés à votre compte.'
  collaborationImpact: 'Les collaborateurs pourraient ne plus voir vos contributions.'
  auditRetention: 'Les modifications que vous avez apportées aux événements restent dans leur journal d’audit, avec votre nom, pendant deux ans au maximum.'
  irreversible: 'Cette action est irréversible.'

blockers:
  title: 'Votre compte ne peut pas encore être supprimé'
  description: 'Vous êtes le seul directeur, propriétaire ou administrateur des éléments suivants. Attribuez ce rôle à une autre personne ou supprimez-les d’abord.'
  event: 'Événement'
  newsletter: 'Newsletter'
  organization: 'Organisation'

action:
  delete: 'Supprimer le compte'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Usuń konto'

disclaimer:
  title: 'Usunięcie konta'
  description: 'Usunięcie konta jest działaniem trwałym i nieodwracalnym. Przed kontynuowaniem zapoznaj się z poniższymi informacjami:'
  dataRemoval: 'Wszystkie Twoje dane osobowe, ustawienia i powiązane informacje zostaną trwale usunięte.'
  accessLoss: 'Utracisz dostęp do wszystkich wydarzeń, narzędzi i usług powiązanych z Twoim kontem.'
  collaborationImpact: 'Inni współpracownicy mogą nie mieć już dostępu do Twoich treści.'
  auditRetention: 'Zmiany wprowadzone przez Ciebie w wydarzeniach pozostaną w ich dzienniku zmian wraz z Twoim imieniem i nazwiskiem przez maksymalnie dwa lata.'
  irreversible: 'Ta operacja jest ostateczna.'

blockers:
  title: 'Nie można jeszcze usunąć Twojego konta'
  description: 'Jesteś jedynym kierownikiem, właścicielem lub administratorem poniższych pozycji. Przekaż tę rolę innej osobie lub najpierw je usuń.'
  event: 'Wydarzenie'
  newsletter: 'Newsletter'
  organization: 'Organizacja'

action:
  delete: 'Usuń konto'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Smazat účet'

disclaimer:
  title: 'Smazání účtu'
  description: 'Smazání vašeho účtu je trvalý a nevratný krok. Před pokračováním si prosím přečtěte následující:'
  dataRemoval: 'Všechny vaše osobní údaje, nastavení a související data budou trvale odstraněny.'
  accessLoss: 'Ztratíte přístup ke všem akcím, nástrojům a službám spojeným s vaším účtem.'
  collaborationImpact: 'Spolupracovníci již nemusí mít přístup k vašim příspěvkům.'
  auditRetention: 'Změny, které jste provedli v akcích, zůstanou v jejich protokolu změn s vaším jménem až dva roky.'
  irreversible: 'Tato akce je nevratná.'

blockers:
  title: 'Váš účet zatím nelze smazat'
  description: 'Jste jediným vedoucím, vlastníkem nebo správcem následujících položek. Předejte tuto roli jiné osobě nebo je nejprve smažte.'
  event: 'Akce'
  newsletter: 'Newsletter'
  organization: 'Organizace'

action:
  delete: 'Smazat účet'
</i18n>
