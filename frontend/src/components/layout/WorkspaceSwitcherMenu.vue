<template>
  <q-list
    class="workspace-switcher-menu"
    :class="{ 'workspace-switcher-menu--compact': compact }"
  >
    <q-item-label header>
      {{ t('switch') }}
    </q-item-label>

    <!-- A user with access to a single area gets a plain list — the accordion
         would only add chrome around the one thing they ever switch. -->
    <workspace-switcher-entries
      v-if="soleArea"
      :entries="soleArea.entries"
      :past="soleArea.past"
      :past-label="t('past')"
      :index-to="soleArea.indexTo"
      :all-label="soleArea.allLabel"
      @select="selectSole"
    />

    <template v-else>
      <template
        v-for="area in availableAreas"
        :key="area.name"
      >
        <!-- Nothing left to list once the current entity is filtered out, so an
             expansion item would open onto an empty panel. The row itself is
             the only useful action. -->
        <q-item
          v-if="!hasEntries(area)"
          v-close-popup
          clickable
          @click="goToIndex(area)"
        >
          <q-item-section avatar>
            <q-icon
              :name="area.icon"
              :color="area.name === currentArea ? 'primary' : undefined"
            />
          </q-item-section>

          <q-item-section
            :class="{
              'text-primary text-weight-medium': area.name === currentArea,
            }"
          >
            {{ area.label }}
          </q-item-section>

          <q-item-section side>
            <q-skeleton
              v-if="area.loading"
              type="QBadge"
            />
            <q-badge
              v-else
              :color="area.name === currentArea ? 'primary' : 'grey-6'"
              :label="area.count"
            />
          </q-item-section>
        </q-item>

        <!-- The whole header expands; opening the area's index is the
             trailing arrow, so both actions stay one click without competing
             for the same hit area. -->
        <q-expansion-item
          v-else
          group="workspace-switcher"
          :default-opened="area.name === currentArea"
        >
          <template #header>
            <q-item-section avatar>
              <q-icon
                :name="area.icon"
                :color="area.name === currentArea ? 'primary' : undefined"
              />
            </q-item-section>

            <q-item-section
              :class="{
                'text-primary text-weight-medium': area.name === currentArea,
              }"
            >
              {{ area.label }}
            </q-item-section>

            <q-item-section side>
              <div class="row items-center no-wrap q-gutter-x-sm">
                <q-skeleton
                  v-if="area.loading"
                  type="QBadge"
                />
                <q-badge
                  v-else
                  :color="area.name === currentArea ? 'primary' : 'grey-6'"
                  :label="area.count"
                />
                <q-btn
                  v-close-popup
                  dense
                  flat
                  round
                  size="sm"
                  icon="arrow_forward"
                  :aria-label="t('open', { area: area.label })"
                  @click.stop="goToIndex(area)"
                >
                  <q-tooltip>
                    {{ t('open', { area: area.label }) }}
                  </q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </template>

          <workspace-switcher-entries
            :entries="area.entries"
            :past="area.past"
            :past-label="t('past')"
            :inset="!compact"
            @select="(id) => select(area.name, id)"
          />
        </q-expansion-item>
      </template>
    </template>

    <q-separator spaced />

    <!-- Management has no other way back to the public site, so the camp
         overview is offered here rather than only from the landing page. -->
    <q-item
      v-close-popup
      clickable
      :to="{ name: 'camps' }"
      active-class=""
      exact-active-class=""
    >
      <q-item-section avatar>
        <q-icon name="public" />
      </q-item-section>
      <q-item-section>
        {{ t('listed_camps') }}
      </q-item-section>
    </q-item>

    <q-item
      v-if="administrator"
      v-close-popup
      clickable
      :to="{ name: 'administration' }"
      active-class=""
      exact-active-class=""
    >
      <q-item-section avatar>
        <q-icon name="manage_accounts" />
      </q-item-section>
      <q-item-section>
        {{ t('area.administration') }}
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProfileStore } from '@/stores/profile-store';
import { useAssignedCampsStore } from '@/stores/assigned-camps-store';
import { useNewsletterStore } from '@/stores/newsletter-store';
import { useOrganizationsStore } from '@/stores/organizations-store';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { isCampPast } from '@/utils/campPhase';
import WorkspaceSwitcherEntries from '@/components/layout/WorkspaceSwitcherEntries.vue';
import {
  areaFromRouteName,
  useWorkspaceAreaAccess,
  type WorkspaceAreaName,
  type WorkspaceEntry,
} from '@/components/layout/workspaceArea';

// Beyond this the "all …" row carries the rest, so the menu cannot grow past
// roughly a screen no matter how many camps a user manages.
const MAX_ENTRIES = 8;

interface WorkspaceArea {
  name: WorkspaceAreaName;
  label: string;
  icon: string;
  indexTo: RouteLocationRaw;
  allLabel: string;
  entries: WorkspaceEntry[];
  past: WorkspaceEntry[];
  count: number;
  loading: boolean;
}

const quasar = useQuasar();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { to } = useObjectTranslation();

const profileStore = useProfileStore();
const assignedCampsStore = useAssignedCampsStore();
const newsletterStore = useNewsletterStore();
const organizationsStore = useOrganizationsStore();

const { user } = storeToRefs(profileStore);
const { hasNewsletters, hasOrganizations } = useWorkspaceAreaAccess();

// Rendered in a bottom sheet rather than an anchored menu: it owns the full
// width, and indenting nested rows would spend it on nothing.
const compact = computed<boolean>(() => quasar.screen.lt.sm);

const administrator = computed<boolean>(() => user.value?.role === 'ADMIN');

const currentArea = computed<WorkspaceAreaName | undefined>(() =>
  areaFromRouteName(route.name),
);

function currentParam(key: string): string | undefined {
  const value = route.params[key];
  return Array.isArray(value) ? value[0] : value;
}

const campArea = computed<WorkspaceArea>(() => {
  const currentId = currentParam('campId');
  const camps = (assignedCampsStore.data ?? [])
    .filter((camp) => camp.id !== currentId)
    .sort((a, b) => b.startAt.localeCompare(a.startAt));

  const toEntry = (id: string, label: string): WorkspaceEntry => ({
    id,
    label,
    icon: 'cabin',
  });

  return {
    name: 'camps',
    label: t('area.camps'),
    icon: 'cabin',
    indexTo: { name: 'management.camps' },
    allLabel: t('all_camps'),
    entries: camps
      .filter((camp) => !isCampPast(camp))
      .slice(0, MAX_ENTRIES)
      .map((camp) => toEntry(camp.id, to(camp.name))),
    past: camps
      .filter((camp) => isCampPast(camp))
      .slice(0, MAX_ENTRIES)
      .map((camp) => toEntry(camp.id, to(camp.name))),
    count: assignedCampsStore.data?.length ?? 0,
    loading: assignedCampsStore.isLoading,
  };
});

const newsletterArea = computed<WorkspaceArea>(() => {
  const currentId = currentParam('newsletterId');

  return {
    name: 'newsletters',
    label: t('area.newsletters'),
    icon: 'mail',
    indexTo: { name: 'management.newsletters' },
    allLabel: t('all_newsletters'),
    entries: (newsletterStore.data ?? [])
      .filter((newsletter) => newsletter.id !== currentId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, MAX_ENTRIES)
      .map((newsletter) => ({
        id: newsletter.id,
        label: newsletter.name,
        icon: 'mail',
      })),
    past: [],
    count: newsletterStore.data?.length ?? 0,
    loading: newsletterStore.isLoading,
  };
});

const organizationArea = computed<WorkspaceArea>(() => {
  const currentId = currentParam('organizationId');

  return {
    name: 'organizations',
    label: t('area.organizations'),
    icon: 'apartment',
    indexTo: { name: 'management.organizations' },
    allLabel: t('all_organizations'),
    entries: (organizationsStore.data ?? [])
      .filter((organization) => organization.id !== currentId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, MAX_ENTRIES)
      .map((organization) => ({
        id: organization.id,
        label: organization.name,
        icon: 'apartment',
        caption:
          organization.verificationStatus === 'VERIFIED'
            ? undefined
            : t(`verification.${organization.verificationStatus}`),
      })),
    past: [],
    count: organizationsStore.data?.length ?? 0,
    loading: organizationsStore.isLoading,
  };
});

// Camps are always offered: they are the core of the app, and the area's
// index is how a user with none reaches the create flow. The other two appear
// only once the user actually holds access somewhere.
const availableAreas = computed<WorkspaceArea[]>(() => {
  const areas = [campArea.value];

  if (hasNewsletters.value) {
    areas.push(newsletterArea.value);
  }
  if (hasOrganizations.value) {
    areas.push(organizationArea.value);
  }

  return areas;
});

const soleArea = computed<WorkspaceArea | undefined>(() =>
  availableAreas.value.length === 1 ? availableAreas.value[0] : undefined,
);

// This component mounts when the panel opens, which is too late to fetch —
// `useWorkspacePrefetch()` in WorkspaceSwitcher has already warmed the stores
// by then.

function hasEntries(area: WorkspaceArea): boolean {
  return area.entries.length > 0 || area.past.length > 0;
}

function selectSole(id: string) {
  if (soleArea.value) {
    select(soleArea.value.name, id);
  }
}

function goToIndex(area: WorkspaceArea) {
  void router.push(area.indexTo);
}

function select(area: WorkspaceAreaName, id: string) {
  switch (area) {
    case 'camps':
      goTo('management.camp', 'campId', id);
      break;
    case 'newsletters':
      goTo('management.newsletter', 'newsletterId', id);
      break;
    case 'organizations':
      goTo('management.organization', 'organizationId', id);
      break;
  }
}

/**
 * Switching within the area the user is already in keeps the current sub-page,
 * so moving from one camp's room planner lands on the next camp's room planner.
 */
function goTo(rootName: string, param: string, id: string) {
  const name = typeof route.name === 'string' ? route.name : '';

  if (name.startsWith(`${rootName}.`) && route.params[param]) {
    void router.push({ name, params: { ...route.params, [param]: id } });
    return;
  }

  void router.push({ name: rootName, params: { [param]: id } });
}
</script>

<style scoped>
.workspace-switcher-menu {
  min-width: min(260px, calc(100vw - 32px));
  max-width: min(420px, calc(100vw - 32px));
}

/* In the sheet the width is the sheet's, so the menu must not cap itself. */
.workspace-switcher-menu--compact {
  min-width: 100%;
  max-width: 100%;
}
</style>

<i18n lang="yaml" locale="en">
switch: 'Switch to'
open: 'Open {area}'
past: 'Past'
area:
  camps: 'Camps'
  newsletters: 'Newsletters'
  organizations: 'Organizations'
  administration: 'Administration'
all_camps: 'All camps'
all_newsletters: 'All newsletters'
all_organizations: 'All organizations'
listed_camps: 'Camp overview'
verification:
  PENDING: 'Awaiting review'
  REJECTED: 'Rejected'
</i18n>

<i18n lang="yaml" locale="de">
switch: 'Wechseln zu'
open: '{area} öffnen'
past: 'Vergangen'
area:
  camps: 'Camps'
  newsletters: 'Newsletter'
  organizations: 'Organisationen'
  administration: 'Verwaltung'
all_camps: 'Alle Camps'
all_newsletters: 'Alle Newsletter'
all_organizations: 'Alle Organisationen'
listed_camps: 'Camp-Übersicht'
verification:
  PENDING: 'Wird geprüft'
  REJECTED: 'Abgelehnt'
</i18n>

<i18n lang="yaml" locale="fr">
switch: 'Aller à'
open: 'Ouvrir {area}'
past: 'Passés'
area:
  camps: 'Camps'
  newsletters: 'Newsletters'
  organizations: 'Organisations'
  administration: 'Administration'
all_camps: 'Tous les camps'
all_newsletters: 'Toutes les newsletters'
all_organizations: 'Toutes les organisations'
listed_camps: 'Aperçu des camps'
verification:
  PENDING: 'En attente de vérification'
  REJECTED: 'Refusée'
</i18n>

<i18n lang="yaml" locale="pl">
switch: 'Przejdź do'
open: 'Otwórz {area}'
past: 'Minione'
area:
  camps: 'Obozy'
  newsletters: 'Newslettery'
  organizations: 'Organizacje'
  administration: 'Administracja'
all_camps: 'Wszystkie obozy'
all_newsletters: 'Wszystkie newslettery'
all_organizations: 'Wszystkie organizacje'
listed_camps: 'Przegląd obozów'
verification:
  PENDING: 'Oczekuje na weryfikację'
  REJECTED: 'Odrzucona'
</i18n>

<i18n lang="yaml" locale="cs">
switch: 'Přejít na'
open: 'Otevřít {area}'
past: 'Minulé'
area:
  camps: 'Tábory'
  newsletters: 'Newslettery'
  organizations: 'Organizace'
  administration: 'Administrace'
all_camps: 'Všechny tábory'
all_newsletters: 'Všechny newslettery'
all_organizations: 'Všechny organizace'
listed_camps: 'Přehled táborů'
verification:
  PENDING: 'Čeká na ověření'
  REJECTED: 'Zamítnuto'
</i18n>
