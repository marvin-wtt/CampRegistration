<template>
  <page-state-handler
    padding
    :error
    :loading="isLoading"
    class="row justify-center"
  >
    <!-- Explicit flex gaps throughout: Quasar's `q-gutter-*` works by negative
         margins, which do not compose with the nested `col-*` grid below. -->
    <div
      v-if="organization"
      class="dashboard-shell col-12 col-sm-10 col-md-8"
    >
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-text">
          <h1 class="text-h6 text-weight-medium q-my-none">
            {{ organization.name }}
          </h1>
          <p class="text-body2 text-on-surface-variant q-my-none">
            {{ t('subtitle') }}
          </p>
        </div>
        <q-chip
          square
          :icon="statusIcon"
          :label="t(`status.${organization.verificationStatus}`)"
          :class="`status-chip status--${organization.verificationStatus.toLowerCase()}`"
        />
      </header>

      <!-- The one thing worth interrupting for: nothing this org makes reaches
           anyone until it is verified. -->
      <q-card
        v-if="organization.verificationStatus !== 'VERIFIED'"
        flat
        bordered
        class="status-note rounded-lg"
        :class="{ 'status-note--rejected': rejected }"
      >
        <div class="status-note-body">
          <q-icon
            :name="rejected ? 'gpp_bad' : 'gpp_maybe'"
            size="22px"
            class="status-note-icon"
          />
          <div class="col">
            <p class="text-body2 q-my-none">
              {{ t(`note.${organization.verificationStatus}`) }}
            </p>
            <!-- Cleared server-side whenever the status leaves REJECTED, so
                 a note always belongs to the rejection on screen. -->
            <template v-if="organization.reviewNote">
              <div class="text-body2 text-weight-medium q-mt-sm">
                {{ t('note.reviewNote') }}
              </div>
              <p class="text-body2 q-my-none">{{ organization.reviewNote }}</p>
            </template>
          </div>
          <div
            v-if="canOrg('organization.edit')"
            class="status-note-actions"
          >
            <q-btn
              flat
              no-caps
              dense
              :color="rejected ? undefined : 'primary'"
              :label="t('note.settings')"
              :to="{ name: 'management.organization.settings' }"
            />
            <q-btn
              v-if="rejected"
              flat
              no-caps
              dense
              class="status-note-request"
              :label="t('note.request')"
              @click="requestReview"
            />
          </div>
        </div>
      </q-card>

      <!-- Verification is refused while no privacy notice is published, so the
           overview names the missing step instead of leaving it to a rejection. -->
      <q-card
        v-if="privacyNoticeMissing"
        flat
        bordered
        class="privacy-note rounded-lg"
      >
        <div class="privacy-note-body">
          <q-icon
            name="privacy_tip"
            size="22px"
            class="privacy-note-icon"
          />
          <div class="col">
            <div class="text-body2 text-weight-medium">
              {{ t('privacy.title') }}
            </div>
            <p class="text-body2 q-my-none">{{ t('privacy.message') }}</p>
          </div>
          <q-btn
            flat
            no-caps
            dense
            color="primary"
            class="privacy-note-action"
            :label="t('privacy.action')"
            :to="{ name: 'management.organization.privacy' }"
          />
        </div>
      </q-card>

      <!-- Counts -->
      <div class="stat-grid">
        <q-card
          v-for="stat in stats"
          :key="stat.key"
          flat
          bordered
          class="stat-card rounded-lg"
          :class="{ 'stat-card--clickable': stat.to }"
          @click="openStat(stat)"
        >
          <div class="stat-body">
            <q-avatar
              size="44px"
              class="stat-avatar"
            >
              <q-icon
                :name="stat.icon"
                size="22px"
              />
            </q-avatar>
            <div class="col">
              <div class="text-h6 text-weight-bold q-mb-none">
                {{ stat.value }}
              </div>
              <div class="text-body2 text-on-surface-variant">
                {{ stat.label }}
              </div>
            </div>
            <q-icon
              v-if="stat.to"
              name="chevron_right"
              size="20px"
              class="text-on-surface-variant"
            />
          </div>
        </q-card>
      </div>

      <!-- Quick links -->
      <q-list
        v-if="links.length > 0"
        bordered
        separator
        class="rounded-lg"
      >
        <q-item
          v-for="link in links"
          :key="link.to"
          clickable
          :to="{ name: link.to }"
        >
          <q-item-section avatar>
            <q-icon :name="link.icon" />
          </q-item-section>
          <q-item-section>{{ link.label }}</q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { useOrganizationDetailsStore } from '@/stores/organization-details-store';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';
import { usePrivacyNoticeService } from '@/services/PrivacyNoticeService';
import type { OrganizationPermission } from '@camp-registration/common/permissions';

const { t } = useI18n();
const quasar = useQuasar();
const router = useRouter();
const store = useOrganizationDetailsStore();
const { data: organization, isLoading, error } = storeToRefs(store);
const { canOrg } = useOrganizationPermissions();
const { fetchOrganizationNotice } = usePrivacyNoticeService();

// Null until the lookup answers, so the hint never flashes for an organization
// that has published one.
const privacyNoticePublished = ref<boolean | null>(null);

const privacyNoticeMissing = computed(
  () => privacyNoticePublished.value === false,
);

onMounted(async () => {
  await store.fetchData();
});

// Keyed on the organization, not on the mount: the page is reused when the
// route switches to another organization.
watch(
  () => organization.value?.id,
  async (id) => {
    privacyNoticePublished.value = null;
    if (!id) {
      return;
    }

    try {
      const notice = await fetchOrganizationNotice(id);
      privacyNoticePublished.value = notice.publishedVersion !== null;
    } catch {
      // A hint, not a gate: if the lookup fails it simply stays hidden.
    }
  },
  { immediate: true },
);

const rejected = computed(
  () => organization.value?.verificationStatus === 'REJECTED',
);

function requestReview() {
  quasar
    .dialog({
      title: t('request.title'),
      message: t('request.message'),
      cancel: { color: 'primary', flat: true, rounded: true, noCaps: true },
      ok: {
        label: t('request.confirm'),
        color: 'primary',
        rounded: true,
        noCaps: true,
      },
    })
    .onOk(() => {
      void store.submitVerification();
    });
}

const statusIcon = computed(() => {
  const status = organization.value?.verificationStatus;
  if (status === 'VERIFIED') return 'verified';
  if (status === 'REJECTED') return 'gpp_bad';
  return 'schedule';
});

interface Stat {
  key: string;
  icon: string;
  label: string;
  value: number;
  to?: string;
}

const stats = computed<Stat[]>(() => {
  const data = organization.value;
  if (!data) {
    return [];
  }

  return [
    {
      key: 'events',
      icon: 'holiday_village',
      label: t('stat.events'),
      value: data.ownedEvents,
      ...(canOrg('organization.events.view')
        ? { to: 'management.organization.events' }
        : {}),
    },
    {
      key: 'newsletters',
      icon: 'mail',
      label: t('stat.newsletters'),
      value: data.ownedNewsletters,
      ...(canOrg('organization.newsletters.view')
        ? { to: 'management.organization.newsletters' }
        : {}),
    },
  ];
});

function openStat(stat: Stat) {
  if (stat.to) {
    void router.push({ name: stat.to });
  }
}

interface QuickLink {
  to: string;
  icon: string;
  label: string;
  permission: OrganizationPermission;
}

const links = computed<QuickLink[]>(() =>
  (
    [
      {
        to: 'management.organization.members',
        icon: 'group',
        label: t('link.members'),
        permission: 'organization.members.view',
      },
      {
        to: 'management.organization.privacy',
        icon: 'privacy_tip',
        label: t('link.privacy'),
        permission: 'organization.view',
      },
      {
        to: 'management.organization.settings',
        icon: 'settings',
        label: t('link.settings'),
        permission: 'organization.edit',
      },
    ] satisfies QuickLink[]
  ).filter((link) => canOrg(link.permission)),
);
</script>

<style lang="scss" scoped>
.dashboard-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 24px;
}

/* Chip aligned to the title's line rather than the block's middle, so it does
   not drift downward as the subtitle wraps. */
.dashboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.header-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-chip {
  flex: none;
  height: 28px;
  margin: 0;
  padding: 0 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
}

.status-chip :deep(.q-icon) {
  font-size: 16px;
}

.status--verified {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.status--pending {
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
}

.status--rejected {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.status-note {
  border-left: 4px solid var(--md3-outline);
  background: var(--md3-surface-container-low);
  color: var(--md3-on-surface-variant);
}

.status-note-body {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.status-note-icon {
  flex: none;
  color: var(--md3-on-surface-variant);
}

.status-note-actions {
  flex: none;
  display: flex;
  gap: 4px;
}

/* A rejection is the one state the owner has to act on, so it carries the
   error role rather than the neutral surface a pending review gets. */
.status-note--rejected {
  border-left-color: var(--md3-error);
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.status-note--rejected .status-note-icon,
.status-note--rejected .status-note-actions .q-btn {
  color: var(--md3-on-error-container);
}

/* Only the request carries weight: on an error-container ground both buttons
   inherit the same color, so nothing else separates the action from the link. */
.status-note-request {
  font-weight: 700;
}

/* Same shape as the status note, primary-accented: it names an action the
   owner still has to take rather than a state they are waiting on. */
.privacy-note {
  border-left: 4px solid var(--md3-primary);
  background: var(--md3-surface-container-low);
}

.privacy-note-body {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.privacy-note-icon {
  flex: none;
  color: var(--md3-primary);
}

.privacy-note-action {
  flex: none;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.stat-card {
  transition:
    background-color 120ms ease,
    border-color 120ms ease;
}

.stat-card--clickable {
  cursor: pointer;
}

.stat-card--clickable:hover {
  border-color: var(--md3-outline);
  background: var(--md3-surface-container-low);
}

.stat-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.stat-avatar {
  flex: none;
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
}

/* The banner's action drops under the text before the column gets cramped. */
@media (max-width: 599px) {
  .status-note-body,
  .privacy-note-body {
    flex-wrap: wrap;
  }

  .status-note-actions,
  .privacy-note-action {
    margin-left: 34px;
  }
}
</style>

<i18n lang="yaml" locale="en">
subtitle: 'Overview of this organization'
status:
  PENDING: 'Awaiting verification'
  VERIFIED: 'Verified'
  REJECTED: 'Not verified'
note:
  PENDING: 'Events stay hidden and newsletters cannot send until this organization is verified.'
  REJECTED: 'This organization was not verified. Events stay hidden and newsletters cannot send. Correct the details, then request a new review.'
  reviewNote: 'Reviewer note'
  request: 'Request review'
  settings: 'Check settings'
request:
  title: 'Request a new review?'
  message: 'Make sure everything the reviewer flagged is corrected first. The organization goes back into the queue and stays hidden until it is verified.'
  confirm: 'Request review'
privacy:
  title: 'Privacy notice missing'
  message: 'This organization cannot be verified until its privacy notice is published. It is the baseline every event of this organization uses.'
  action: 'Set up'
stat:
  events: 'Events'
  newsletters: 'Newsletters'
link:
  members: 'Members'
  privacy: 'Privacy'
  settings: 'Settings'
</i18n>

<i18n lang="yaml" locale="de">
subtitle: 'Überblick über diese Organisation'
status:
  PENDING: 'Verifizierung ausstehend'
  VERIFIED: 'Verifiziert'
  REJECTED: 'Nicht verifiziert'
note:
  PENDING: 'Events bleiben verborgen und Newsletter können nicht senden, bis diese Organisation verifiziert ist.'
  REJECTED: 'Diese Organisation wurde nicht verifiziert. Events bleiben verborgen und Newsletter können nicht senden. Korrigiere die Angaben und fordere anschließend eine neue Prüfung an.'
  reviewNote: 'Hinweis der Prüfung'
  request: 'Prüfung anfordern'
  settings: 'Einstellungen prüfen'
request:
  title: 'Neue Prüfung anfordern?'
  message: 'Korrigiere zuerst alles, was die Prüfung beanstandet hat. Die Organisation kommt zurück in die Warteschlange und bleibt verborgen, bis sie verifiziert ist.'
  confirm: 'Prüfung anfordern'
privacy:
  title: 'Datenschutzerklärung fehlt'
  message: 'Diese Organisation kann erst verifiziert werden, wenn ihre Datenschutzerklärung veröffentlicht ist. Sie ist die Grundlage für jedes Event dieser Organisation.'
  action: 'Einrichten'
stat:
  events: 'Events'
  newsletters: 'Newsletter'
link:
  members: 'Mitglieder'
  privacy: 'Datenschutz'
  settings: 'Einstellungen'
</i18n>

<i18n lang="yaml" locale="fr">
subtitle: 'Aperçu de cette organisation'
status:
  PENDING: 'Vérification en attente'
  VERIFIED: 'Vérifiée'
  REJECTED: 'Non vérifiée'
note:
  PENDING: "Les events restent masqués et les newsletters ne peuvent pas être envoyées tant que cette organisation n'est pas vérifiée."
  REJECTED: "Cette organisation n'a pas été vérifiée. Les events restent masqués et les newsletters ne peuvent pas être envoyées. Corrige les informations, puis demande une nouvelle vérification."
  reviewNote: 'Note du vérificateur'
  request: 'Demander une vérification'
  settings: 'Vérifier les paramètres'
request:
  title: 'Demander une nouvelle vérification ?'
  message: "Corrige d'abord tout ce que le vérificateur a signalé. L'organisation retourne dans la file et reste masquée jusqu'à sa vérification."
  confirm: 'Demander'
privacy:
  title: 'Politique de confidentialité manquante'
  message: "Cette organisation ne peut pas être vérifiée tant que sa politique de confidentialité n'est pas publiée. Elle sert de base à chacun de ses events."
  action: 'Configurer'
stat:
  events: 'Events'
  newsletters: 'Newsletters'
link:
  members: 'Membres'
  privacy: 'Confidentialité'
  settings: 'Paramètres'
</i18n>

<i18n lang="yaml" locale="pl">
subtitle: 'Przegląd tej organizacji'
status:
  PENDING: 'Oczekuje na weryfikację'
  VERIFIED: 'Zweryfikowana'
  REJECTED: 'Niezweryfikowana'
note:
  PENDING: 'Obozy pozostają ukryte, a newslettery nie mogą być wysyłane, dopóki ta organizacja nie zostanie zweryfikowana.'
  REJECTED: 'Ta organizacja nie została zweryfikowana. Obozy pozostają ukryte, a newslettery nie mogą być wysyłane. Popraw dane, a następnie poproś o ponowną weryfikację.'
  reviewNote: 'Uwaga weryfikatora'
  request: 'Poproś o weryfikację'
  settings: 'Sprawdź ustawienia'
request:
  title: 'Poprosić o ponowną weryfikację?'
  message: 'Najpierw popraw wszystko, co zgłosił weryfikator. Organizacja wraca do kolejki i pozostaje ukryta do czasu weryfikacji.'
  confirm: 'Poproś o weryfikację'
privacy:
  title: 'Brak informacji o ochronie danych'
  message: 'Tej organizacji nie można zweryfikować, dopóki nie opublikuje informacji o ochronie danych. Stanowi ona podstawę dla każdego obozu tej organizacji.'
  action: 'Skonfiguruj'
stat:
  events: 'Obozy'
  newsletters: 'Newslettery'
link:
  members: 'Członkowie'
  privacy: 'Prywatność'
  settings: 'Ustawienia'
</i18n>

<i18n lang="yaml" locale="cs">
subtitle: 'Přehled této organizace'
status:
  PENDING: 'Čeká na ověření'
  VERIFIED: 'Ověřená'
  REJECTED: 'Neověřená'
note:
  PENDING: 'Tábory zůstávají skryté a newslettery nelze odesílat, dokud nebude tato organizace ověřena.'
  REJECTED: 'Tato organizace nebyla ověřena. Tábory zůstávají skryté a newslettery nelze odesílat. Oprav údaje a poté požádej o nové ověření.'
  reviewNote: 'Poznámka ověřovatele'
  request: 'Požádat o ověření'
  settings: 'Zkontrolovat nastavení'
request:
  title: 'Požádat o nové ověření?'
  message: 'Nejdřív oprav vše, co ověřovatel vytkl. Organizace se vrátí do fronty a zůstane skrytá, dokud nebude ověřena.'
  confirm: 'Požádat o ověření'
privacy:
  title: 'Chybí zásady ochrany osobních údajů'
  message: 'Tuto organizaci nelze ověřit, dokud nezveřejní zásady ochrany osobních údajů. Jsou základem pro každý tábor této organizace.'
  action: 'Nastavit'
stat:
  events: 'Tábory'
  newsletters: 'Newslettery'
link:
  members: 'Členové'
  privacy: 'Soukromí'
  settings: 'Nastavení'
</i18n>
