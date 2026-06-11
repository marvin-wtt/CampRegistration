<template>
  <page-state-handler
    padding
    :error
    :loading
    class="row justify-center"
  >
    <div class="col-12 col-md-11 col-lg-10 col-xl-9 column q-gutter-y-lg">
      <!-- Header -->
      <div class="row items-center q-col-gutter-sm">
        <div class="col-12 col-sm">
          <div class="text-h5 text-weight-medium">{{ campName }}</div>
          <div class="text-body2 text-grey-6 q-mt-xs">{{ dateRange }}</div>
        </div>
        <div class="col-12 col-sm-auto row q-gutter-sm items-center">
          <q-chip
            v-if="countdown"
            square
            color="primary"
            text-color="white"
            icon="event"
            :label="countdown"
          />
          <q-chip
            square
            :color="registrationStatus.color"
            text-color="white"
            :icon="registrationStatus.icon"
            :label="registrationStatus.label"
          />
        </div>
      </div>

      <!-- Per-country breakdown (priority for multi-country camps) -->
      <country-breakdown-table
        v-if="stats.multiCountryCamp.value"
        :rows="stats.perCountry.value"
        :show-pending="showPending"
      />

      <!-- Overall KPI cards -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <stat-card
            :label="t('kpi.accepted')"
            :value="acceptedValue"
            icon="groups"
            color="primary"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <stat-card
            :label="t('kpi.free')"
            :value="freeValue"
            icon="event_available"
            color="teal"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <stat-card
            :label="t('kpi.pending')"
            :value="stats.counts.value.pending"
            :caption="t('kpi.pendingCaption')"
            icon="hourglass_top"
            color="orange"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <stat-card
            :label="t('kpi.waitlisted')"
            :value="stats.counts.value.waitlisted"
            icon="event_seat"
            color="blue-grey"
          />
        </div>
      </div>

      <!-- Main grid -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-8">
          <demographics-explorer :people="stats.participants.value" />
        </div>

        <div class="col-12 col-md-4 column q-gutter-y-md">
          <!-- Needs attention -->
          <q-card
            flat
            bordered
            class="rounded-borders"
          >
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-medium">
                {{ t('attention.title') }}
              </div>
            </q-card-section>
            <q-list
              v-if="attentionItems.length > 0"
              separator
            >
              <q-item
                v-for="item in attentionItems"
                :key="item.key"
                clickable
                v-ripple
                @click="goToParticipants"
              >
                <q-item-section avatar>
                  <q-icon
                    :name="item.icon"
                    :color="item.color"
                  />
                </q-item-section>
                <q-item-section>{{ item.label }}</q-item-section>
                <q-item-section side>
                  <q-badge :color="item.color">{{ item.count }}</q-badge>
                </q-item-section>
              </q-item>
            </q-list>
            <q-card-section
              v-else
              class="text-grey-6 text-center"
            >
              <q-icon
                name="check_circle"
                color="positive"
                size="32px"
              />
              <div class="q-mt-xs">{{ t('attention.empty') }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import PageStateHandler from 'components/common/PageStateHandler.vue';
import StatCard from 'components/campManagement/dashboard/StatCard.vue';
import CountryBreakdownTable from 'components/campManagement/dashboard/CountryBreakdownTable.vue';
import DemographicsExplorer from 'components/campManagement/dashboard/DemographicsExplorer.vue';
import { useCampDetailsStore } from 'stores/camp-details-store';
import { useRegistrationsStore } from 'stores/registration-store';
import { useCampStatistics } from 'src/composables/campStatistics';
import { useRegistrationHelper } from 'src/composables/registrationHelper';
import { useObjectTranslation } from 'src/composables/objectTranslation';

const { t, d } = useI18n();
const router = useRouter();
const { to } = useObjectTranslation();

const campDetailsStore = useCampDetailsStore();
const registrationStore = useRegistrationsStore();
const stats = useCampStatistics();
const helper = useRegistrationHelper();

const { data: camp } = storeToRefs(campDetailsStore);
const { isLoading: registrationsLoading, error } = storeToRefs(registrationStore);

const loading = computed<boolean>(
  () => registrationsLoading.value || camp.value == null,
);

onMounted(() => {
  void registrationStore.fetchData();
  void campDetailsStore.fetchData();
});

// --- Header ----------------------------------------------------------------

const campName = computed(() => to(camp.value?.name));

const dateRange = computed(() => {
  if (!camp.value) {
    return '';
  }
  const start = new Date(camp.value.startAt);
  const end = new Date(camp.value.endAt);
  return `${d(start, 'short')} – ${d(end, 'short')}`;
});

const countdown = computed<string | undefined>(() => {
  if (!camp.value) {
    return undefined;
  }
  const days = daysFromNow(camp.value.startAt);
  if (days > 0) {
    return t('countdown.until', { days });
  }
  if (days === 0) {
    return t('countdown.today');
  }
  const endDays = daysFromNow(camp.value.endAt);
  return endDays >= 0 ? t('countdown.running') : t('countdown.over');
});

const registrationStatus = computed(() => {
  const c = camp.value;
  if (!c || (!c.registrationOpensAt && !c.registrationClosesAt)) {
    return {
      label: t('registration.unset'),
      color: 'grey',
      icon: 'help',
    };
  }
  const now = new Date();
  const opensAt = c.registrationOpensAt ? new Date(c.registrationOpensAt) : null;
  const closesAt = c.registrationClosesAt
    ? new Date(c.registrationClosesAt)
    : null;

  if (opensAt && now < opensAt) {
    return { label: t('registration.upcoming'), color: 'blue', icon: 'schedule' };
  }
  if (closesAt && now > closesAt) {
    return { label: t('registration.closed'), color: 'grey-7', icon: 'lock' };
  }
  return { label: t('registration.open'), color: 'positive', icon: 'lock_open' };
});

function daysFromNow(date: string): number {
  const target = new Date(date);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// --- KPIs ------------------------------------------------------------------

const acceptedValue = computed(() => {
  const accepted = stats.counts.value.accepted;
  const max = stats.capacity.value.max;
  return max != null ? `${accepted} / ${max}` : String(accepted);
});

const freeValue = computed<string>(() => {
  const free = stats.capacity.value.free;
  return free != null ? String(free) : '—';
});

// Pending only matters when registrations are confirmed manually.
const showPending = computed<boolean>(
  () => camp.value?.confirmationMode !== 'AUTOMATIC',
);

// --- Needs attention -------------------------------------------------------

const attentionItems = computed(() => {
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

  const items = [
    {
      key: 'pending',
      label: t('attention.pending'),
      count: pending,
      icon: 'hourglass_top',
      color: 'orange',
    },
    {
      key: 'missing',
      label: t('attention.missing'),
      count: missingInfo,
      icon: 'contact_mail',
      color: 'red',
    },
    {
      key: 'age',
      label: t('attention.age'),
      count: ageOutOfRange,
      icon: 'cake',
      color: 'deep-orange',
    },
  ];

  return items.filter((item) => item.count > 0);
});

function goToParticipants() {
  void router.push({ name: 'management.camp.participants' });
}
</script>

<i18n lang="yaml" locale="en">
countdown:
  until: '{days} days to go'
  today: 'Starts today'
  running: 'In progress'
  over: 'Finished'
registration:
  open: 'Registration open'
  closed: 'Registration closed'
  upcoming: 'Registration upcoming'
  unset: 'No registration dates'
kpi:
  accepted: 'Accepted'
  free: 'Free places'
  pending: 'Pending'
  pendingCaption: 'Awaiting confirmation'
  waitlisted: 'Waitlisted'
attention:
  title: 'Needs attention'
  empty: 'Everything looks good.'
  pending: 'Pending confirmations'
  missing: 'Missing contact details'
  age: 'Age outside camp range'
</i18n>

<i18n lang="yaml" locale="de">
countdown:
  until: 'Noch {days} Tage'
  today: 'Beginnt heute'
  running: 'Läuft gerade'
  over: 'Beendet'
registration:
  open: 'Anmeldung offen'
  closed: 'Anmeldung geschlossen'
  upcoming: 'Anmeldung bevorstehend'
  unset: 'Keine Anmeldedaten'
kpi:
  accepted: 'Bestätigt'
  free: 'Freie Plätze'
  pending: 'Ausstehend'
  pendingCaption: 'Warten auf Bestätigung'
  waitlisted: 'Warteliste'
attention:
  title: 'Zu erledigen'
  empty: 'Alles in Ordnung.'
  pending: 'Ausstehende Bestätigungen'
  missing: 'Fehlende Kontaktdaten'
  age: 'Alter außerhalb des Bereichs'
</i18n>

<i18n lang="yaml" locale="fr">
countdown:
  until: 'Encore {days} jours'
  today: 'Commence aujourd''hui'
  running: 'En cours'
  over: 'Terminé'
registration:
  open: 'Inscription ouverte'
  closed: 'Inscription fermée'
  upcoming: 'Inscription à venir'
  unset: 'Aucune date d''inscription'
kpi:
  accepted: 'Acceptés'
  free: 'Places libres'
  pending: 'En attente'
  pendingCaption: 'En attente de confirmation'
  waitlisted: 'Liste d''attente'
attention:
  title: 'À traiter'
  empty: 'Tout semble en ordre.'
  pending: 'Confirmations en attente'
  missing: 'Coordonnées manquantes'
  age: 'Âge hors de la plage'
</i18n>

<i18n lang="yaml" locale="pl">
countdown:
  until: 'Pozostało {days} dni'
  today: 'Zaczyna się dziś'
  running: 'W trakcie'
  over: 'Zakończono'
registration:
  open: 'Rejestracja otwarta'
  closed: 'Rejestracja zamknięta'
  upcoming: 'Rejestracja wkrótce'
  unset: 'Brak dat rejestracji'
kpi:
  accepted: 'Zaakceptowani'
  free: 'Wolne miejsca'
  pending: 'Oczekujący'
  pendingCaption: 'Oczekują na potwierdzenie'
  waitlisted: 'Lista rezerwowa'
attention:
  title: 'Wymaga uwagi'
  empty: 'Wszystko w porządku.'
  pending: 'Oczekujące potwierdzenia'
  missing: 'Brakujące dane kontaktowe'
  age: 'Wiek poza zakresem'
</i18n>

<i18n lang="yaml" locale="cs">
countdown:
  until: 'Zbývá {days} dní'
  today: 'Začíná dnes'
  running: 'Probíhá'
  over: 'Ukončeno'
registration:
  open: 'Registrace otevřena'
  closed: 'Registrace uzavřena'
  upcoming: 'Registrace již brzy'
  unset: 'Žádná data registrace'
kpi:
  accepted: 'Přijatí'
  free: 'Volná místa'
  pending: 'Čekající'
  pendingCaption: 'Čeká na potvrzení'
  waitlisted: 'Čekací listina'
attention:
  title: 'Vyžaduje pozornost'
  empty: 'Vše vypadá v pořádku.'
  pending: 'Čekající potvrzení'
  missing: 'Chybějící kontaktní údaje'
  age: 'Věk mimo rozsah'
</i18n>
