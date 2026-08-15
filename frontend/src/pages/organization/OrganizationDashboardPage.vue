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
      >
        <div class="status-note-body">
          <q-icon
            name="gpp_maybe"
            size="22px"
            class="status-note-icon"
          />
          <p class="col text-body2 q-my-none">
            {{ t(`note.${organization.verificationStatus}`) }}
          </p>
          <q-btn
            flat
            no-caps
            dense
            color="primary"
            class="status-note-action"
            :label="t('note.action')"
            :to="{ name: 'management.organization.verification' }"
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
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import { useOrganizationDetailsStore } from '@/stores/organization-details-store';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';
import type { OrganizationPermission } from '@camp-registration/common/permissions';

const { t } = useI18n();
const router = useRouter();
const store = useOrganizationDetailsStore();
const { data: organization, isLoading, error } = storeToRefs(store);
const { canOrg } = useOrganizationPermissions();

onMounted(async () => {
  await store.fetchData();
});

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
      key: 'camps',
      icon: 'holiday_village',
      label: t('stat.camps'),
      value: data.ownedCamps,
      ...(canOrg('organization.camps.view')
        ? { to: 'management.organization.camps' }
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
        to: 'management.organization.verification',
        icon: 'verified_user',
        label: t('link.verification'),
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

.status-note-action {
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
  .status-note-body {
    flex-wrap: wrap;
  }

  .status-note-action {
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
  PENDING: 'Camps stay hidden and newsletters cannot send until this organization is verified.'
  REJECTED: 'This organization was not verified. Camps stay hidden and newsletters cannot send.'
  action: 'Details'
stat:
  camps: 'Camps'
  newsletters: 'Newsletters'
link:
  members: 'Members'
  verification: 'Verification'
  settings: 'Settings'
</i18n>

<i18n lang="yaml" locale="de">
subtitle: 'Überblick über diese Organisation'
status:
  PENDING: 'Verifizierung ausstehend'
  VERIFIED: 'Verifiziert'
  REJECTED: 'Nicht verifiziert'
note:
  PENDING: 'Camps bleiben verborgen und Newsletter können nicht senden, bis diese Organisation verifiziert ist.'
  REJECTED: 'Diese Organisation wurde nicht verifiziert. Camps bleiben verborgen und Newsletter können nicht senden.'
  action: 'Details'
stat:
  camps: 'Camps'
  newsletters: 'Newsletter'
link:
  members: 'Mitglieder'
  verification: 'Verifizierung'
  settings: 'Einstellungen'
</i18n>

<i18n lang="yaml" locale="fr">
subtitle: 'Aperçu de cette organisation'
status:
  PENDING: 'Vérification en attente'
  VERIFIED: 'Vérifiée'
  REJECTED: 'Non vérifiée'
note:
  PENDING: "Les camps restent masqués et les newsletters ne peuvent pas être envoyées tant que cette organisation n'est pas vérifiée."
  REJECTED: "Cette organisation n'a pas été vérifiée. Les camps restent masqués et les newsletters ne peuvent pas être envoyées."
  action: 'Détails'
stat:
  camps: 'Camps'
  newsletters: 'Newsletters'
link:
  members: 'Membres'
  verification: 'Vérification'
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
  REJECTED: 'Ta organizacja nie została zweryfikowana. Obozy pozostają ukryte, a newslettery nie mogą być wysyłane.'
  action: 'Szczegóły'
stat:
  camps: 'Obozy'
  newsletters: 'Newslettery'
link:
  members: 'Członkowie'
  verification: 'Weryfikacja'
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
  REJECTED: 'Tato organizace nebyla ověřena. Tábory zůstávají skryté a newslettery nelze odesílat.'
  action: 'Podrobnosti'
stat:
  camps: 'Tábory'
  newsletters: 'Newslettery'
link:
  members: 'Členové'
  verification: 'Ověření'
  settings: 'Nastavení'
</i18n>
