<template>
  <page-state-handler
    padding
    :error
    class="row justify-center"
  >
    <!-- Each data card renders its own skeleton while `loading`. -->
    <div class="dashboard-shell col-12 col-md-11 col-xl-10">
      <event-summary-hero :loading>
        <template
          v-if="shortcutsLoading || quickActions.length > 0"
          #actions
        >
          <template v-if="shortcutsLoading">
            <q-skeleton
              v-for="width in ['132px', '152px', '116px', '104px']"
              :key="width"
              type="QBtn"
              :width="width"
              class="shortcut-skeleton"
            />
          </template>
          <template v-else>
            <m-btn
              v-for="action in quickActions"
              :key="action.key"
              :label="action.label"
              :icon="action.icon"
              :to="{ name: action.route }"
              secondary
              tonal
              no-caps
            />
          </template>
        </template>
      </event-summary-hero>

      <!-- The most consequential thing a manager can be unaware of: the event is
       configured correctly but reaching nobody. -->
      <organization-unverified-notice
        v-if="event"
        subject="event"
        :organization-id="event.organizationId"
        :organization-name="event.organizationName"
        :verification-status="event.organizationVerificationStatus"
      />

      <!-- Wide screens: numbers and charts on the left, things to do on the
           right. Narrow screens: one column, ordered by `area-*`. -->
      <div class="dashboard-columns">
        <div class="dashboard-column dashboard-column--main">
          <registration-overview-card
            :loading
            class="area-registrations"
          />

          <demographics-explorer
            :people="stats.acceptedParticipants.value"
            :loading
            class="area-demographics"
          />
        </div>

        <div class="dashboard-column dashboard-column--side">
          <q-card
            v-if="!loading && attentionItems.length > 0"
            flat
            bordered
            class="attention-card area-attention"
          >
            <q-card-section>
              <dashboard-card-header
                icon="notifications_active"
                tone="warning"
                :title="t('attention.title')"
                :caption="t('attention.subtitle')"
              />
            </q-card-section>
            <q-card-section class="attention-grid q-pt-none">
              <button
                v-for="item in attentionItems"
                :key="item.key"
                type="button"
                class="attention-item"
                @click="goToItem(item)"
              >
                <q-icon
                  :name="item.icon"
                  size="20px"
                  class="attention-item__icon"
                />
                <span class="attention-item__label">{{ item.label }}</span>
                <span class="attention-item__count">{{ item.count }}</span>
                <q-icon
                  name="chevron_right"
                  size="18px"
                  class="attention-item__chevron"
                />
              </button>
            </q-card-section>
          </q-card>

          <tasks-due-widget
            v-if="can('event.tasks.view') && isShown('tasks')"
            :loading="tasksLoading"
            class="area-tasks"
          />

          <!-- Renders nothing on days without duties. -->
          <today-duties-widget
            v-if="
              can('event.chore_assignments.view') &&
              can('event.chores.view') &&
              isShown('chore_planner')
            "
            class="area-duties"
          />

          <!-- Administrative, so it trails everything else on narrow screens. -->
          <price-model-widget
            v-if="can('event.billing.view')"
            id="event-billing"
            class="area-billing"
          />
        </div>
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import EventSummaryHero from '@/components/event/dashboard/EventSummaryHero.vue';
import TodayDutiesWidget from '@/components/event/dashboard/TodayDutiesWidget.vue';
import RegistrationOverviewCard from '@/components/event/dashboard/RegistrationOverviewCard.vue';
import DashboardCardHeader from '@/components/event/dashboard/DashboardCardHeader.vue';
import DemographicsExplorer from '@/components/event/dashboard/DemographicsExplorer.vue';
import TasksDueWidget from '@/components/event/dashboard/TasksDueWidget.vue';
import PriceModelWidget from '@/components/event/dashboard/PriceModelWidget.vue';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useProfileStore } from '@/stores/profile-store';
import { useRegistrationsStore } from '@/stores/registration-store';
import { useEventFilesStore } from '@/stores/event-files-store';
import { useTaskStore } from '@/stores/task-store';
import { useEventBillingStore } from '@/stores/event-billing-store';
import { useEventStatistics } from '@/composables/eventStatistics';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { usePermissions } from '@/composables/permissions';
import OrganizationUnverifiedNotice from '@/components/organization/OrganizationUnverifiedNotice.vue';
import {
  LOCAL_TEMPLATE_AGE,
  LOCAL_TEMPLATE_MISSING,
  LOCAL_TEMPLATE_PENDING,
} from '@/components/event/table/localTableTemplates';
import { useNavigationSettings } from '@/composables/eventNavigationSettings';
import type { PermissionRequirement } from '@/composables/scopePermissions';
import type { HideableNavigationItem } from '@camp-registration/common/settings';

const { t } = useI18n();
const router = useRouter();

const eventDetailsStore = useEventDetailsStore();
const profileStore = useProfileStore();
const registrationStore = useRegistrationsStore();
const eventFilesStore = useEventFilesStore();
const taskStore = useTaskStore();
const billingStore = useEventBillingStore();
const stats = useEventStatistics();
const helper = useRegistrationHelper();
const { can, canAccess } = usePermissions();
const { settings: navigationSettings, isLoading: navigationLoading } =
  useNavigationSettings();

// Features hidden from the nav rail are hidden here too.
function isShown(item: HideableNavigationItem): boolean {
  return !navigationSettings.hiddenItems.includes(item);
}

const {
  data: event,
  isLoading: eventLoading,
  error: eventError,
} = storeToRefs(eventDetailsStore);
const { isLoading: registrationsLoading, error: registrationsError } =
  storeToRefs(registrationStore);

// Shortcuts depend on permissions (profile and event) and the hidden nav items;
// most managers have some, so they are skeletonized rather than left out.
const shortcutsLoading = computed<boolean>(
  () =>
    navigationLoading.value ||
    profileStore.user === undefined ||
    event.value === undefined,
);

const loading = computed<boolean>(
  () => registrationsLoading.value || eventLoading.value,
);

// Tasks are optional to the dashboard: a failed fetch falls back to the
// widget's empty state.
const tasksLoading = computed<boolean>(() => taskStore.isLoading);

const error = computed<string | null>(
  () => eventError.value ?? registrationsError.value,
);

// Started during setup, not awaited: the stores flag themselves loading before
// the first render, so the page renders its skeletons instead of an idle frame.
void registrationStore.fetchData();
void eventDetailsStore.fetchData();
void eventFilesStore.fetchData();
void taskStore.fetchData();
watch(
  () => can('event.billing.view'),
  (allowed) => {
    if (allowed) {
      void billingStore.fetchData();
    }
  },
  { immediate: true },
);

interface QuickAction {
  key: string;
  label: string;
  icon: string;
  route: string;
  permission: PermissionRequirement<'event'>;
  navItem?: HideableNavigationItem;
}

const quickActions = computed<QuickAction[]>(() =>
  (
    [
      {
        key: 'participants',
        label: t('actions.participants'),
        icon: 'groups',
        route: 'management.event.participants',
        permission: 'event.registrations.view',
      },
      {
        key: 'contact',
        label: t('actions.contact'),
        icon: 'mark_email_unread',
        route: 'management.event.contact',
        navItem: 'contact',
        permission: { any: ['event.messages.create', 'event.messages.view'] },
      },
      {
        key: 'program',
        label: t('actions.program'),
        icon: 'calendar_month',
        route: 'management.event.program-planner',
        navItem: 'program_planner',
        permission: 'event.program_items.view',
      },
      {
        key: 'rooms',
        label: t('actions.rooms'),
        icon: 'bed',
        route: 'management.event.room-planner',
        navItem: 'room_planner',
        permission: 'event.rooms.view',
      },
    ] satisfies QuickAction[]
  ).filter(
    (action) =>
      canAccess(action.permission) &&
      (!action.navItem || isShown(action.navItem)),
  ),
);

interface AttentionItem {
  key: string;
  label: string;
  count: number;
  icon: string;
  // Deep-links into the participants table via a hidden local template…
  template?: string;
  // …or navigates to another management route (e.g. file settings)…
  route?: string;
  // …or scrolls to a section of this page.
  anchor?: string;
}

const attentionItems = computed<AttentionItem[]>(() => {
  const participants = stats.participants.value;
  const event = eventDetailsStore.data;

  const pending = stats.counts.value.pending;

  const missingInfo = participants.filter(
    (r) => !helper.email(r) || !helper.fullName(r),
  ).length;

  const ageOutOfRange = participants.filter((r) => {
    const age = helper.age(r);
    if (age == null || event == null) {
      return false;
    }
    return age < event.minAge || age > event.maxAge;
  }).length;

  // Event file slots that need attention: declared but not uploaded, plus slots
  // missing a file for one of the event's locales (see event-files-store).
  const missingFiles = eventFilesStore.missingFilesCount;

  // Once the invoice is out, paying it is on the organizer.
  const bill = billingStore.data?.bill;
  const unpaidInvoices =
    can('event.billing.view') &&
    bill?.status === 'OPEN' &&
    bill.invoices.some((invoice) => invoice.type === 'INVOICE')
      ? 1
      : 0;

  const items: AttentionItem[] = [
    {
      key: 'pending',
      label: t('attention.pending'),
      count: pending,
      icon: 'hourglass_top',
      template: LOCAL_TEMPLATE_PENDING,
    },
    {
      key: 'missing',
      label: t('attention.missing'),
      count: missingInfo,
      icon: 'contact_mail',
      template: LOCAL_TEMPLATE_MISSING,
    },
    {
      key: 'age',
      label: t('attention.age'),
      count: ageOutOfRange,
      icon: 'cake',
      template: LOCAL_TEMPLATE_AGE,
    },
    {
      key: 'files',
      label: t('attention.files'),
      count: missingFiles,
      icon: 'upload_file',
      route: 'management.event.settings.files',
    },
    {
      key: 'invoice',
      label: t('attention.invoice'),
      count: unpaidInvoices,
      icon: 'receipt_long',
      anchor: 'event-billing',
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
    return;
  }
  if (item.anchor) {
    document
      .getElementById(item.anchor)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function goToTemplate(template: string) {
  void router.push({
    name: 'management.event.participants',
    query: { template },
  });
}

function goTo(routeName: string) {
  void router.push({ name: routeName });
}
</script>

<style scoped>
.shortcut-skeleton {
  height: 40px;
  border-radius: 999px;
}

@media (max-width: 599px) {
  .shortcut-skeleton {
    width: auto !important;
  }
}

.dashboard-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1440px;
}

.dashboard-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
}

/* Single column: the wrappers dissolve so the areas can be reordered. */
.dashboard-column {
  display: contents;
}

.area-attention {
  order: 1;
}

.area-registrations {
  order: 2;
}

.area-tasks {
  order: 3;
}

.area-duties {
  order: 4;
}

.area-demographics {
  order: 5;
}

.area-billing {
  order: 6;
}

.attention-card {
  border-radius: 16px;
  border-color: color-mix(in srgb, var(--md3-warning) 45%, transparent);
  background: color-mix(in srgb, var(--md3-warning) 6%, var(--md3-surface));
}

.attention-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 8px;
}

.attention-item {
  display: flex;
  min-width: 0;
  min-height: 48px;
  align-items: center;
  gap: 12px;
  padding: 8px 8px 8px 12px;
  color: var(--md3-on-surface);
  font: inherit;
  text-align: left;
  cursor: pointer;
  background: var(--md3-surface);
  border: 1px solid var(--md3-outline-variant);
  border-radius: 12px;
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

.attention-item__icon {
  color: var(--md3-warning);
}

.attention-item__label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.875rem;
  font-weight: 500;
}

.attention-item__count {
  min-width: 24px;
  padding: 2px 8px;
  color: var(--md3-on-warning-container);
  font-size: 0.8125rem;
  font-weight: 700;
  text-align: center;
  background: var(--md3-warning-container);
  border-radius: 999px;
}

.attention-item__chevron {
  color: var(--md3-on-surface-variant);
}

@media (min-width: 1280px) {
  .dashboard-columns {
    grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
    align-items: start;
  }

  .dashboard-column {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 20px;
  }

  /* Nothing to do (or nothing permitted): the main column takes the width. */
  .dashboard-columns:has(> .dashboard-column--side:empty) {
    grid-template-columns: minmax(0, 1fr);
  }

  .dashboard-column--side:empty {
    display: none;
  }
}

@media (max-width: 599px) {
  .dashboard-shell,
  .dashboard-columns {
    gap: 16px;
  }
}
</style>

<i18n lang="yaml" locale="en">
actions:
  participants: 'Participants'
  contact: 'Communication'
  program: 'Program'
  rooms: 'Rooms'
attention:
  title: 'Needs attention'
  subtitle: 'Items that may require a decision'
  pending: 'Pending confirmations'
  missing: 'Missing contact details'
  age: 'Age outside event range'
  files: 'Missing files'
  invoice: 'Invoice awaiting payment'
</i18n>

<i18n lang="yaml" locale="de">
actions:
  participants: 'Teilnehmende'
  contact: 'Kommunikation'
  program: 'Programm'
  rooms: 'Zimmer'
attention:
  title: 'Zu erledigen'
  subtitle: 'Punkte, die eine Entscheidung benötigen'
  pending: 'Ausstehende Bestätigungen'
  missing: 'Fehlende Kontaktdaten'
  age: 'Alter außerhalb des Bereichs'
  files: 'Fehlende Dateien'
  invoice: 'Rechnung offen'
</i18n>

<i18n lang="yaml" locale="fr">
actions:
  participants: 'Participants'
  contact: 'Communication'
  program: 'Programme'
  rooms: 'Chambres'
attention:
  title: 'À traiter'
  subtitle: 'Éléments nécessitant une décision'
  pending: 'Confirmations en attente'
  missing: 'Coordonnées manquantes'
  age: 'Âge hors de la plage'
  files: 'Fichiers manquants'
  invoice: 'Facture en attente de paiement'
</i18n>

<i18n lang="yaml" locale="pl">
actions:
  participants: 'Uczestnicy'
  contact: 'Komunikacja'
  program: 'Program'
  rooms: 'Pokoje'
attention:
  title: 'Wymaga uwagi'
  subtitle: 'Sprawy wymagające decyzji'
  pending: 'Oczekujące potwierdzenia'
  missing: 'Brakujące dane kontaktowe'
  age: 'Wiek poza zakresem'
  files: 'Brakujące pliki'
  invoice: 'Faktura oczekuje na płatność'
</i18n>

<i18n lang="yaml" locale="cs">
actions:
  participants: 'Účastníci'
  contact: 'Komunikace'
  program: 'Program'
  rooms: 'Pokoje'
attention:
  title: 'Vyžaduje pozornost'
  subtitle: 'Položky vyžadující rozhodnutí'
  pending: 'Čekající potvrzení'
  missing: 'Chybějící kontaktní údaje'
  age: 'Věk mimo rozsah'
  files: 'Chybějící soubory'
  invoice: 'Faktura čeká na úhradu'
</i18n>
