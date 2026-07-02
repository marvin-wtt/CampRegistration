<template>
  <page-state-handler
    padding
    :error
    :loading
    class="row justify-center"
  >
    <div class="dashboard-shell col-12 col-md-11 col-xl-10">
      <camp-summary-hero />

      <section class="dashboard-section">
        <div class="section-heading row items-end justify-between q-mb-sm">
          <div>
            <div class="text-overline text-primary text-weight-bold">
              {{ t('actions.eyebrow') }}
            </div>
            <h2 class="text-h6 text-weight-bold q-my-none">
              {{ t('actions.title') }}
            </h2>
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div
            v-for="action in quickActions"
            :key="action.key"
            class="col-12 col-sm-6 col-lg-3"
          >
            <q-card
              flat
              bordered
              class="quick-action-card full-height cursor-pointer"
              tabindex="0"
              role="link"
              @click="goTo(action.route)"
              @keyup.enter="goTo(action.route)"
              @keyup.space.prevent="goTo(action.route)"
            >
              <q-card-section class="row items-center no-wrap q-gutter-md">
                <div
                  class="quick-action-icon row items-center justify-center"
                  :class="`text-${action.color}`"
                >
                  <q-icon
                    :name="action.icon"
                    size="24px"
                  />
                </div>
                <div class="col">
                  <div class="text-subtitle2 text-weight-bold">
                    {{ action.label }}
                  </div>
                  <div class="text-caption text-grey-7">
                    {{ action.caption }}
                  </div>
                </div>
                <q-icon
                  name="arrow_forward"
                  color="grey-6"
                  size="18px"
                />
              </q-card-section>
            </q-card>
          </div>
        </div>
      </section>

      <q-card
        v-if="attentionItems.length > 0"
        flat
        bordered
        class="attention-card"
      >
        <q-card-section class="attention-content">
          <div class="attention-heading row items-center no-wrap q-gutter-sm">
            <div class="attention-icon row items-center justify-center">
              <q-icon
                name="notifications_active"
                color="warning"
                size="22px"
              />
            </div>
            <div class="col">
              <div class="text-subtitle1 text-weight-bold">
                {{ t('attention.title') }}
              </div>
              <div class="text-caption text-grey-7">
                {{ t('attention.subtitle') }}
              </div>
            </div>
          </div>

          <div class="attention-grid">
            <button
              v-for="item in attentionItems"
              :key="item.key"
              type="button"
              class="attention-item"
              @click="goToItem(item)"
            >
              <div class="attention-icon row items-center justify-center">
                <q-icon
                  :name="item.icon"
                  :color="item.color"
                  size="20px"
                />
              </div>
              <span class="col text-left text-body2 text-weight-medium">
                {{ item.label }}
              </span>
              <q-badge
                :color="item.color"
                rounded
              >
                {{ item.count }}
              </q-badge>
              <q-icon
                name="chevron_right"
                color="grey-6"
                size="18px"
              />
            </button>
          </div>
        </q-card-section>
      </q-card>

      <section class="dashboard-section">
        <div class="section-heading q-mb-sm">
          <div class="text-overline text-primary text-weight-bold">
            {{ t('overview.eyebrow') }}
          </div>
          <h2 class="text-h6 text-weight-bold q-my-none">
            {{ t('overview.title') }}
          </h2>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-6 col-md-3 col-xs-12">
            <stat-card
              :label="t('kpi.registrations')"
              :value="stats.counts.value.total"
              :caption="t('kpi.registrationsCaption')"
              icon="how_to_reg"
              color="indigo"
            />
          </div>
          <div
            v-if="showPending"
            class="col-6 col-md-3 col-xs-12"
          >
            <stat-card
              :label="t('kpi.pending')"
              :value="stats.counts.value.pending"
              :caption="t('kpi.pendingCaption')"
              icon="hourglass_top"
              color="orange"
            />
          </div>
          <div class="col-6 col-md-3 col-xs-12">
            <stat-card
              :label="t('kpi.waitlisted')"
              :value="stats.counts.value.waitlisted"
              :caption="t('kpi.waitlistedCaption')"
              icon="event_seat"
              color="blue-grey"
            />
          </div>
          <div class="col-6 col-md-3 col-xs-12">
            <stat-card
              :label="t('kpi.team')"
              :value="stats.staff.value.length"
              :caption="t('kpi.teamCaption')"
              icon="supervisor_account"
              color="deep-purple"
            />
          </div>
        </div>
      </section>

      <section
        v-if="stats.multiCountryCamp.value"
        class="dashboard-section"
      >
        <country-breakdown-table
          :rows="stats.perCountry.value"
          :show-pending="showPending"
        />
      </section>

      <section class="dashboard-section">
        <demographics-explorer :people="stats.acceptedParticipants.value" />
      </section>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import CampSummaryHero from 'components/campManagement/dashboard/CampSummaryHero.vue';
import StatCard from 'components/campManagement/dashboard/StatCard.vue';
import CountryBreakdownTable from 'components/campManagement/dashboard/CountryBreakdownTable.vue';
import DemographicsExplorer from 'components/campManagement/dashboard/DemographicsExplorer.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useRegistrationsStore } from 'stores/registration-store';
import { useCampFilesStore } from 'stores/camp-files-store';
import { useCampStatistics } from 'src/composables/campStatistics';
import { useRegistrationHelper } from 'src/composables/registrationHelper';
import {
  LOCAL_TEMPLATE_AGE,
  LOCAL_TEMPLATE_MISSING,
  LOCAL_TEMPLATE_PENDING,
} from 'components/campManagement/table/localTableTemplates';

const { t } = useI18n();
const router = useRouter();

const campDetailsStore = useCampDetailsStore();
const registrationStore = useRegistrationsStore();
const campFilesStore = useCampFilesStore();
const stats = useCampStatistics();
const helper = useRegistrationHelper();

const {
  data: camp,
  isLoading: campLoading,
  error: campError,
} = storeToRefs(campDetailsStore);
const { isLoading: registrationsLoading, error: registrationsError } =
  storeToRefs(registrationStore);

const loading = computed<boolean>(
  () => registrationsLoading.value || campLoading.value,
);

const error = computed<string | null>(
  () => campError.value ?? registrationsError.value,
);

onMounted(() => {
  void registrationStore.fetchData();
  void campDetailsStore.fetchData();
  void campFilesStore.fetchData();
});

// Pending only matters when registrations are confirmed manually.
const showPending = computed<boolean>(
  () => camp.value?.confirmationMode !== 'AUTOMATIC',
);

const quickActions = computed(() => [
  {
    key: 'participants',
    label: t('actions.participants.label'),
    caption: t('actions.participants.caption'),
    icon: 'groups',
    color: 'primary',
    route: 'management.camp.participants',
  },
  {
    key: 'contact',
    label: t('actions.contact.label'),
    caption: t('actions.contact.caption'),
    icon: 'mark_email_unread',
    color: 'teal',
    route: 'management.camp.contact',
  },
  {
    key: 'program',
    label: t('actions.program.label'),
    caption: t('actions.program.caption'),
    icon: 'calendar_month',
    color: 'deep-orange',
    route: 'management.camp.program-planner',
  },
  {
    key: 'rooms',
    label: t('actions.rooms.label'),
    caption: t('actions.rooms.caption'),
    icon: 'bed',
    color: 'deep-purple',
    route: 'management.camp.room-planner',
  },
]);

interface AttentionItem {
  key: string;
  label: string;
  count: number;
  icon: string;
  color: string;
  // Deep-links into the participants table via a hidden local template…
  template?: string;
  // …or navigates to another management route (e.g. file settings).
  route?: string;
}

const attentionItems = computed<AttentionItem[]>(() => {
  const participants = stats.participants.value;
  const camp = campDetailsStore.data;

  const pending = stats.counts.value.pending;

  const missingInfo = participants.filter(
    (r) => !helper.email(r) || !helper.fullName(r),
  ).length;

  const ageOutOfRange = participants.filter((r) => {
    const age = helper.age(r);
    if (age == null || camp == null) {
      return false;
    }
    return age < camp.minAge || age > camp.maxAge;
  }).length;

  // Camp file slots that need attention: declared but not uploaded, plus slots
  // missing a file for one of the camp's locales (see camp-files-store).
  const missingFiles = campFilesStore.missingFilesCount;

  const items: AttentionItem[] = [
    {
      key: 'pending',
      label: t('attention.pending'),
      count: pending,
      icon: 'hourglass_top',
      color: 'orange',
      template: LOCAL_TEMPLATE_PENDING,
    },
    {
      key: 'missing',
      label: t('attention.missing'),
      count: missingInfo,
      icon: 'contact_mail',
      color: 'red',
      template: LOCAL_TEMPLATE_MISSING,
    },
    {
      key: 'age',
      label: t('attention.age'),
      count: ageOutOfRange,
      icon: 'cake',
      color: 'deep-orange',
      template: LOCAL_TEMPLATE_AGE,
    },
    {
      key: 'files',
      label: t('attention.files'),
      count: missingFiles,
      icon: 'upload_file',
      color: 'blue',
      route: 'management.camp.settings.files',
    },
  ];

  return items.filter((item) => item.count > 0);
});

function goToItem(item: AttentionItem) {
  if (item.template) {
    goToTemplate(item.template);
    return;
  }
  if (item.route) {
    goTo(item.route);
  }
}

function goToTemplate(template: string) {
  void router.push({
    name: 'management.camp.participants',
    query: { template },
  });
}

function goTo(routeName: string) {
  void router.push({ name: routeName });
}
</script>

<style scoped>
.dashboard-shell {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 1440px;
}

.dashboard-section {
  min-width: 0;
}

.section-heading {
  padding-inline: 2px;
}

.quick-action-card,
.attention-card {
  border-radius: 16px;
}

.quick-action-card {
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.quick-action-card:hover,
.quick-action-card:focus-visible {
  border-color: var(--q-primary);
  box-shadow: 0 8px 24px rgba(38, 50, 56, 0.1);
  outline: none;
  transform: translateY(-2px);
}

.quick-action-icon,
.attention-icon {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border-radius: 13px;
  background: rgba(127, 127, 127, 0.1);
}

.attention-card {
  border-left: 4px solid var(--md3-warning);
  background: color-mix(in srgb, var(--md3-warning) 7%, var(--md3-surface));
}

.attention-content {
  display: grid;
  grid-template-columns: minmax(220px, 0.7fr) minmax(0, 2fr);
  gap: 16px 24px;
  padding: 16px;
}

.attention-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.attention-item {
  display: flex;
  min-width: 0;
  min-height: 52px;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  background: var(--md3-surface);
  border: 1px solid var(--md3-outline-variant);
  border-radius: 10px;
  transition:
    border-color 0.18s ease,
    background 0.18s ease;
}

.attention-item:hover,
.attention-item:focus-visible {
  background: var(--md3-surface-container-high);
  border-color: var(--md3-warning);
  outline: none;
}

.attention-item .attention-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
}

:global(.body--dark) .quick-action-card:hover,
:global(.body--dark) .quick-action-card:focus-visible {
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.28);
}

@media (max-width: 1199px) {
  .attention-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 899px) {
  .attention-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 599px) {
  .dashboard-shell {
    gap: 22px;
  }

  .quick-action-card .q-card__section {
    padding: 14px;
  }

  .attention-content {
    padding: 14px;
  }
}
</style>

<i18n lang="yaml" locale="en">
kpi:
  registrations: 'Registrations'
  registrationsCaption: 'All participants'
  pending: 'Pending'
  pendingCaption: 'Awaiting confirmation'
  waitlisted: 'Waitlisted'
  waitlistedCaption: 'Waiting for a place'
  team: 'Team'
  teamCaption: 'Leaders and staff'
actions:
  eyebrow: 'Coordinator tools'
  title: 'Quick actions'
  participants:
    label: 'Participants'
    caption: 'Review and manage registrations'
  contact:
    label: 'Communication'
    caption: 'Send updates to your groups'
  program:
    label: 'Program'
    caption: 'Plan the camp schedule'
  rooms:
    label: 'Rooms'
    caption: 'Assign beds and rooms'
overview:
  eyebrow: 'At a glance'
  title: 'Registration overview'
attention:
  title: 'Needs attention'
  subtitle: 'Items that may require a decision'
  pending: 'Pending confirmations'
  missing: 'Missing contact details'
  age: 'Age outside camp range'
  files: 'Missing files'
</i18n>

<i18n lang="yaml" locale="de">
kpi:
  registrations: 'Anmeldungen'
  registrationsCaption: 'Alle Teilnehmenden'
  pending: 'Ausstehend'
  pendingCaption: 'Warten auf Bestätigung'
  waitlisted: 'Warteliste'
  waitlistedCaption: 'Warten auf einen Platz'
  team: 'Team'
  teamCaption: 'Leitung und Mitarbeitende'
actions:
  eyebrow: 'Werkzeuge'
  title: 'Schnellzugriff'
  participants:
    label: 'Teilnehmende'
    caption: 'Anmeldungen verwalten'
  contact:
    label: 'Kommunikation'
    caption: 'Nachrichten an Gruppen senden'
  program:
    label: 'Programm'
    caption: 'Camp-Programm planen'
  rooms:
    label: 'Zimmer'
    caption: 'Betten und Zimmer zuweisen'
overview:
  eyebrow: 'Auf einen Blick'
  title: 'Anmeldeübersicht'
attention:
  title: 'Zu erledigen'
  subtitle: 'Punkte, die eine Entscheidung benötigen'
  pending: 'Ausstehende Bestätigungen'
  missing: 'Fehlende Kontaktdaten'
  age: 'Alter außerhalb des Bereichs'
  files: 'Fehlende Dateien'
</i18n>

<i18n lang="yaml" locale="fr">
kpi:
  registrations: 'Inscriptions'
  registrationsCaption: 'Tous les participants'
  pending: 'En attente'
  pendingCaption: 'En attente de confirmation'
  waitlisted: "Liste d'attente"
  waitlistedCaption: "En attente d'une place"
  team: 'Équipe'
  teamCaption: 'Responsables et équipe'
actions:
  eyebrow: 'Outils de coordination'
  title: 'Actions rapides'
  participants:
    label: 'Participants'
    caption: 'Gérer les inscriptions'
  contact:
    label: 'Communication'
    caption: 'Envoyer des nouvelles aux groupes'
  program:
    label: 'Programme'
    caption: 'Planifier le programme du camp'
  rooms:
    label: 'Chambres'
    caption: 'Attribuer les lits et chambres'
overview:
  eyebrow: "En un coup d'œil"
  title: 'Aperçu des inscriptions'
attention:
  title: 'À traiter'
  subtitle: 'Éléments nécessitant une décision'
  pending: 'Confirmations en attente'
  missing: 'Coordonnées manquantes'
  age: 'Âge hors de la plage'
  files: 'Fichiers manquants'
</i18n>

<i18n lang="yaml" locale="pl">
kpi:
  registrations: 'Rejestracje'
  registrationsCaption: 'Wszyscy uczestnicy'
  pending: 'Oczekujący'
  pendingCaption: 'Oczekują na potwierdzenie'
  waitlisted: 'Lista rezerwowa'
  waitlistedCaption: 'Oczekują na miejsce'
  team: 'Zespół'
  teamCaption: 'Kadra i personel'
actions:
  eyebrow: 'Narzędzia koordynatora'
  title: 'Szybkie działania'
  participants:
    label: 'Uczestnicy'
    caption: 'Zarządzaj rejestracjami'
  contact:
    label: 'Komunikacja'
    caption: 'Wysyłaj wiadomości do grup'
  program:
    label: 'Program'
    caption: 'Zaplanuj harmonogram obozu'
  rooms:
    label: 'Pokoje'
    caption: 'Przydziel łóżka i pokoje'
overview:
  eyebrow: 'W skrócie'
  title: 'Przegląd rejestracji'
attention:
  title: 'Wymaga uwagi'
  subtitle: 'Sprawy wymagające decyzji'
  pending: 'Oczekujące potwierdzenia'
  missing: 'Brakujące dane kontaktowe'
  age: 'Wiek poza zakresem'
  files: 'Brakujące pliki'
</i18n>

<i18n lang="yaml" locale="cs">
kpi:
  registrations: 'Registrace'
  registrationsCaption: 'Všichni účastníci'
  pending: 'Čekající'
  pendingCaption: 'Čeká na potvrzení'
  waitlisted: 'Čekací listina'
  waitlistedCaption: 'Čekají na místo'
  team: 'Tým'
  teamCaption: 'Vedoucí a personál'
actions:
  eyebrow: 'Nástroje koordinátora'
  title: 'Rychlé akce'
  participants:
    label: 'Účastníci'
    caption: 'Správa registrací'
  contact:
    label: 'Komunikace'
    caption: 'Poslat zprávy skupinám'
  program:
    label: 'Program'
    caption: 'Naplánovat program tábora'
  rooms:
    label: 'Pokoje'
    caption: 'Přiřadit lůžka a pokoje'
overview:
  eyebrow: 'Na první pohled'
  title: 'Přehled registrací'
attention:
  title: 'Vyžaduje pozornost'
  subtitle: 'Položky vyžadující rozhodnutí'
  pending: 'Čekající potvrzení'
  missing: 'Chybějící kontaktní údaje'
  age: 'Věk mimo rozsah'
  files: 'Chybějící soubory'
</i18n>
