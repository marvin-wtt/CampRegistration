<template>
  <page-state-handler
    :error
    :loading
    padding
  >
    <div class="dashboard column q-gutter-y-lg">
      <div>
        <div class="text-h5 text-weight-medium">{{ t('title') }}</div>
        <div class="text-body2 text-on-surface-variant q-mt-xs">
          {{ t('subtitle') }}
        </div>
      </div>

      <!-- At-a-glance stats, grouped so camp-related metrics sit together -->
      <div>
        <div class="text-subtitle1 text-weight-medium q-mb-sm">
          {{ t('stat.platformTitle') }}
        </div>
        <div class="row q-col-gutter-md">
          <administration-stat-card
            v-for="stat in platformStats"
            :key="stat.key"
            :label="stat.label"
            :value="stat.value"
            :icon="stat.icon"
            :color="stat.color"
            :to="stat.to"
          />
        </div>
      </div>

      <div>
        <div class="text-subtitle1 text-weight-medium q-mb-sm">
          {{ t('stat.campsTitle') }}
        </div>
        <div class="row q-col-gutter-md">
          <administration-stat-card
            v-for="stat in campStats"
            :key="stat.key"
            :label="stat.label"
            :value="stat.value"
            :icon="stat.icon"
            :color="stat.color"
            :to="stat.to"
          />
        </div>
      </div>

      <!-- Needs attention -->
      <div v-if="attention.length > 0">
        <div class="text-subtitle1 text-weight-medium">
          {{ t('attention.title') }}
        </div>
        <div class="row q-gutter-sm q-mt-xs">
          <q-chip
            v-for="item in attention"
            :key="item.key"
            clickable
            :icon="item.icon"
            :color="item.color"
            text-color="white"
            @click="router.push(item.to)"
          >
            {{ item.label }}
          </q-chip>
        </div>
      </div>

      <!-- Section launcher -->
      <div>
        <div class="text-subtitle1 text-weight-medium q-mb-sm">
          {{ t('sections.title') }}
        </div>
        <div class="row q-col-gutter-md">
          <administration-card
            v-for="item in sections"
            :key="item.name"
            :label="item.label"
            :icon="item.icon"
            :to="item.to"
          >
            <q-card-section class="text-caption text-on-surface-variant">
              {{ item.description }}
            </q-card-section>
          </administration-card>
        </div>
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { type RouteLocationRaw, useRouter } from 'vue-router';
import type { AdminOverview } from '@camp-registration/common/entities';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import AdministrationCard from '@/components/administration/AdministrationCard.vue';
import AdministrationStatCard from '@/components/administration/AdministrationStatCard.vue';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';

interface StatTile {
  key: string;
  icon: string;
  color: string;
  value: number;
  label: string;
  to?: RouteLocationRaw | undefined;
}

interface AttentionItem {
  key: string;
  icon: string;
  color: string;
  label: string;
  to: RouteLocationRaw;
}

const { t } = useI18n();
const router = useRouter();
const api = useAPIService();

const {
  data: overview,
  error,
  isLoading: loading,
  forceFetch,
} = useServiceHandler<AdminOverview>();

onMounted(async () => {
  await forceFetch(() => api.fetchAdminOverview());
});

const platformStats = computed<StatTile[]>(() => {
  const data = overview.value;
  if (!data) {
    return [];
  }

  return [
    {
      key: 'users',
      icon: 'people',
      color: 'primary',
      value: data.users.total,
      label: t('stat.users'),
      to: { name: 'administration.users' },
    },
    {
      key: 'failedJobs',
      icon: 'error_outline',
      color: data.queues.failedJobs > 0 ? 'negative' : 'info',
      value: data.queues.failedJobs,
      label: t('stat.failedJobs'),
      to: { name: 'administration.queues' },
    },
  ];
});

// Grouped separately from platform-wide stats so all camp-related metrics
// (totals, registrations, and the registration-status breakdown) read as
// one block instead of being interleaved with unrelated numbers.
const campStats = computed<StatTile[]>(() => {
  const data = overview.value;
  if (!data) {
    return [];
  }

  return [
    {
      key: 'camps',
      icon: 'holiday_village',
      color: 'secondary',
      value: data.camps.total,
      label: t('stat.camps'),
      to: { name: 'administration.camps' },
    },
    {
      key: 'campsOpen',
      icon: 'event_available',
      color: 'positive',
      value: data.camps.open,
      label: t('stat.campsOpen'),
      to: { name: 'administration.camps', query: { status: 'open' } },
    },
    {
      key: 'campsUpcoming',
      icon: 'schedule',
      color: 'info',
      value: data.camps.upcoming,
      label: t('stat.campsUpcoming'),
      to: { name: 'administration.camps', query: { status: 'upcoming' } },
    },
    {
      key: 'campsClosed',
      icon: 'event_busy',
      color: 'grey-7',
      value: data.camps.closed,
      label: t('stat.campsClosed'),
      to: { name: 'administration.camps', query: { status: 'closed' } },
    },
    {
      key: 'registrations',
      icon: 'assignment_turned_in',
      color: 'tertiary',
      value: data.registrations.total,
      label: t('stat.registrations'),
    },
  ];
});

const attention = computed<AttentionItem[]>(() => {
  const data = overview.value;
  if (!data) {
    return [];
  }

  const items: AttentionItem[] = [];

  if (data.queues.failedJobs > 0) {
    items.push({
      key: 'failedJobs',
      icon: 'error_outline',
      color: 'negative',
      label: t('attention.failedJobs', { count: data.queues.failedJobs }),
      to: { name: 'administration.queues' },
    });
  }

  if (data.users.unverified > 0) {
    items.push({
      key: 'unverified',
      icon: 'mark_email_unread',
      color: 'warning',
      label: t('attention.unverified', { count: data.users.unverified }),
      to: { name: 'administration.users', query: { status: 'unverified' } },
    });
  }

  if (data.users.locked > 0) {
    items.push({
      key: 'locked',
      icon: 'lock',
      color: 'negative',
      label: t('attention.locked', { count: data.users.locked }),
      to: { name: 'administration.users', query: { status: 'locked' } },
    });
  }

  const legalMissing = data.legal.total - data.legal.configured;
  if (legalMissing > 0) {
    items.push({
      key: 'legalMissing',
      icon: 'gavel',
      color: 'warning',
      label: t('attention.legalMissing', { count: legalMissing }),
      to: { name: 'administration.legal' },
    });
  }

  return items;
});

const sections = computed(() => [
  {
    name: 'users',
    label: t('users.label'),
    description: t('users.description'),
    icon: 'people',
    to: { name: 'administration.users' },
  },
  {
    name: 'camps',
    label: t('camps.label'),
    description: t('camps.description'),
    icon: 'holiday_village',
    to: { name: 'administration.camps' },
  },
  {
    name: 'newsletters',
    label: t('newsletters.label'),
    description: t('newsletters.description'),
    icon: 'mail',
    to: { name: 'administration.newsletters' },
  },
  {
    name: 'queues',
    label: t('queues.label'),
    description: t('queues.description'),
    icon: 'queue',
    to: { name: 'administration.queues' },
  },
  {
    name: 'legal',
    label: t('legal.label'),
    description: t('legal.description'),
    icon: 'gavel',
    to: { name: 'administration.legal' },
  },
]);
</script>

<style scoped lang="scss">
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Administration'
subtitle: 'Platform overview and management.'

stat:
  platformTitle: 'Platform'
  campsTitle: 'Camps'
  users: 'Users'
  camps: 'Camps'
  registrations: 'Registrations'
  campsOpen: 'Registration open'
  campsUpcoming: 'Registration upcoming'
  campsClosed: 'Registration closed'
  failedJobs: 'Failed jobs'

attention:
  title: 'Needs attention'
  failedJobs: '{count} failed jobs'
  unverified: '{count} unverified users'
  locked: '{count} locked users'
  legalMissing: '{count} legal documents missing'

sections:
  title: 'Manage'

users:
  label: 'Users'
  description: 'Manage user accounts, roles, and permissions.'
camps:
  label: 'Camps'
  description: 'View and manage all camps across the platform.'
newsletters:
  label: 'Newsletters'
  description: 'Manage newsletter lists and subscriber imports.'
queues:
  label: 'Jobs'
  description: 'Monitor background jobs, retry or delete failed jobs.'
legal:
  label: 'Legal Content'
  description: 'Manage the Imprint and Privacy Policy shown to visitors.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Administration'
subtitle: 'Plattformübersicht und Verwaltung.'

stat:
  platformTitle: 'Plattform'
  campsTitle: 'Camps'
  users: 'Benutzer'
  camps: 'Camps'
  registrations: 'Anmeldungen'
  campsOpen: 'Anmeldung offen'
  campsUpcoming: 'Anmeldung bevorstehend'
  campsClosed: 'Anmeldung geschlossen'
  failedJobs: 'Fehlgeschlagene Jobs'

attention:
  title: 'Erfordert Aufmerksamkeit'
  failedJobs: '{count} fehlgeschlagene Jobs'
  unverified: '{count} unbestätigte Benutzer'
  locked: '{count} gesperrte Benutzer'
  legalMissing: '{count} fehlende rechtliche Inhalte'

sections:
  title: 'Verwalten'

users:
  label: 'Benutzer'
  description: 'Benutzerkonten, Rollen und Berechtigungen verwalten.'
camps:
  label: 'Camps'
  description: 'Alle Camps der Plattform einsehen und verwalten.'
newsletters:
  label: 'Newsletter'
  description: 'Newsletter-Listen und Abonnenten-Importe verwalten.'
queues:
  label: 'Aufgaben'
  description: 'Hintergrundjobs überwachen, fehlgeschlagene Jobs wiederholen oder löschen.'
legal:
  label: 'Rechtliche Inhalte'
  description: 'Impressum und Datenschutzerklärung für Besucher verwalten.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Administration'
subtitle: 'Vue d’ensemble et gestion de la plateforme.'

stat:
  platformTitle: 'Plateforme'
  campsTitle: 'Camps'
  users: 'Utilisateurs'
  camps: 'Camps'
  registrations: 'Inscriptions'
  campsOpen: 'Inscriptions ouvertes'
  campsUpcoming: 'Inscriptions à venir'
  campsClosed: 'Inscriptions fermées'
  failedJobs: 'Tâches échouées'

attention:
  title: 'Nécessite une attention'
  failedJobs: '{count} tâches échouées'
  unverified: '{count} utilisateurs non vérifiés'
  locked: '{count} utilisateurs verrouillés'
  legalMissing: '{count} documents légaux manquants'

sections:
  title: 'Gérer'

users:
  label: 'Utilisateurs'
  description: 'Gérer les comptes utilisateurs, les rôles et les permissions.'
camps:
  label: 'Camps'
  description: 'Consulter et gérer tous les camps de la plateforme.'
newsletters:
  label: 'Newsletters'
  description: "Gérer les listes de newsletters et les importations d'abonnés."
queues:
  label: 'Tâches'
  description: 'Surveiller les tâches en arrière-plan, relancer ou supprimer les tâches échouées.'
legal:
  label: 'Contenu légal'
  description: 'Gérer les mentions légales et la politique de confidentialité affichées aux visiteurs.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Administracja'
subtitle: 'Przegląd i zarządzanie platformą.'

stat:
  platformTitle: 'Platforma'
  campsTitle: 'Obozy'
  users: 'Użytkownicy'
  camps: 'Obozy'
  registrations: 'Rejestracje'
  campsOpen: 'Rejestracja otwarta'
  campsUpcoming: 'Rejestracja nadchodząca'
  campsClosed: 'Rejestracja zamknięta'
  failedJobs: 'Nieudane zadania'

attention:
  title: 'Wymaga uwagi'
  failedJobs: '{count} nieudanych zadań'
  unverified: '{count} niezweryfikowanych użytkowników'
  locked: '{count} zablokowanych użytkowników'
  legalMissing: '{count} brakujących dokumentów prawnych'

sections:
  title: 'Zarządzaj'

users:
  label: 'Użytkownicy'
  description: 'Zarządzaj kontami użytkowników, rolami i uprawnieniami.'
camps:
  label: 'Obozy'
  description: 'Przeglądaj i zarządzaj wszystkimi obozami na platformie.'
newsletters:
  label: 'Newslettery'
  description: 'Zarządzaj listami newsletterów i importami subskrybentów.'
queues:
  label: 'Zadania'
  description: 'Monitoruj zadania w tle, ponawiaj lub usuwaj nieudane zadania.'
legal:
  label: 'Treści prawne'
  description: 'Zarządzaj notą prawną i polityką prywatności widoczną dla odwiedzających.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Administrace'
subtitle: 'Přehled a správa platformy.'

stat:
  platformTitle: 'Platforma'
  campsTitle: 'Tábory'
  users: 'Uživatelé'
  camps: 'Tábory'
  registrations: 'Přihlášky'
  campsOpen: 'Registrace otevřená'
  campsUpcoming: 'Registrace nadcházející'
  campsClosed: 'Registrace uzavřená'
  failedJobs: 'Neúspěšné úlohy'

attention:
  title: 'Vyžaduje pozornost'
  failedJobs: '{count} neúspěšných úloh'
  unverified: '{count} neověřených uživatelů'
  locked: '{count} zamčených uživatelů'
  legalMissing: '{count} chybějících právních dokumentů'

sections:
  title: 'Spravovat'

users:
  label: 'Uživatelé'
  description: 'Spravujte uživatelské účty, role a oprávnění.'
camps:
  label: 'Tábory'
  description: 'Prohlížejte a spravujte všechny tábory na platformě.'
newsletters:
  label: 'Newslettery'
  description: 'Spravujte seznamy newsletterů a importy odběratelů.'
queues:
  label: 'Úlohy'
  description: 'Sledujte úlohy na pozadí, opakujte nebo mažte neúspěšné úlohy.'
legal:
  label: 'Právní obsah'
  description: 'Spravujte tiráž a zásady ochrany osobních údajů zobrazované návštěvníkům.'
</i18n>
