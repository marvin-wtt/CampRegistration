<template>
  <page-state-handler
    padding
    :error
    class="row justify-center"
  >
    <div class="column col-sm-10 col-md-9 col-lg-8 col-12">
      <div class="row items-start justify-between no-wrap q-mb-lg">
        <div class="col page-title">
          <div class="text-h5 text-weight-medium">
            {{ t('title') }}
          </div>
          <div class="text-body2 text-grey-6 q-mt-xs">
            {{ t('subtitle') }}
          </div>
        </div>
        <q-btn
          color="primary"
          icon="add"
          :label="quasar.screen.gt.xs ? t('action.create') : ''"
          :aria-label="t('action.create')"
          :round="quasar.screen.lt.sm"
          :rounded="quasar.screen.gt.xs"
          unelevated
          no-caps
          data-test="organization-create"
          @click="showCreateDialog"
        />
      </div>

      <div
        v-if="organizations.length > 0"
        class="row q-col-gutter-md"
      >
        <div
          v-for="organization in organizations"
          :key="organization.id"
          class="col-12 col-sm-6 col-md-4"
        >
          <q-card
            flat
            bordered
            class="organization-card cursor-pointer full-height rounded-lg"
            @click="
              router.push({
                name: 'management.organization',
                params: { organizationId: organization.id },
              })
            "
          >
            <q-card-section class="q-pa-md">
              <div class="text-subtitle1 text-weight-medium ellipsis">
                {{ organization.name }}
              </div>
              <div class="text-body2 text-on-surface-variant q-mt-xs ellipsis">
                {{ countryName(organization.country, locale) }}
              </div>
              <q-chip
                :icon="statusIcon(organization.verificationStatus)"
                :class="`status--${organization.verificationStatus.toLowerCase()}`"
                dense
                square
                class="q-mt-sm"
              >
                {{ t(`status.${organization.verificationStatus}`) }}
              </q-chip>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div
        v-else-if="!isLoading"
        class="column items-center q-pa-xl text-grey-6"
      >
        <q-icon
          name="apartment"
          size="4rem"
        />
        <div class="text-subtitle1 q-mt-md">{{ t('empty.title') }}</div>
        <div class="text-body2 q-mt-xs text-center">
          {{ t('empty.description') }}
        </div>
      </div>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import OrganizationCreateDialog from '@/components/organization/OrganizationCreateDialog.vue';
import { useOrganizationsStore } from '@/stores/organizations-store';
import { countryName } from '@/utils/countries';
import type {
  Organization,
  OrganizationVerificationStatus,
} from '@camp-registration/common/entities';

const { t, locale } = useI18n();
const router = useRouter();
const quasar = useQuasar();
const store = useOrganizationsStore();
const { data, isLoading, error } = storeToRefs(store);

const organizations = computed<Organization[]>(() => data.value ?? []);

function statusIcon(status: OrganizationVerificationStatus): string {
  if (status === 'VERIFIED') return 'verified';
  if (status === 'REJECTED') return 'cancel';
  return 'hourglass_empty';
}

function showCreateDialog() {
  quasar
    .dialog({ component: OrganizationCreateDialog })
    .onOk((organization: Organization) => {
      void router.push({
        name: 'management.organization',
        params: { organizationId: organization.id },
      });
    });
}

onMounted(async () => {
  await store.fetchData();
});
</script>

<style lang="scss" scoped>
.organization-card {
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 0 0.5rem rgba(var(--md3-on-surface-rgb), 0.15);
  }
}

.status--verified {
  background: var(--md3-positive-container, var(--md3-primary-container));
  color: var(--md3-on-primary-container);
}

.status--pending {
  background: var(--md3-warning-container, var(--md3-secondary-container));
  color: var(--md3-on-secondary-container);
}

.status--rejected {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Organizations'
subtitle: 'Manage the organizations you run events and newsletters under.'
action:
  create: 'Create organization'
status:
  PENDING: 'Awaiting verification'
  VERIFIED: 'Verified'
  REJECTED: 'Rejected'
empty:
  title: 'No organizations yet'
  description: 'Create an organization to run events and newsletters.'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Organisationen'
subtitle: 'Verwalte die Organisationen, unter denen du Veranstaltungen und Newsletter betreibst.'
action:
  create: 'Organisation erstellen'
status:
  PENDING: 'Warten auf Verifizierung'
  VERIFIED: 'Verifiziert'
  REJECTED: 'Abgelehnt'
empty:
  title: 'Noch keine Organisationen'
  description: 'Erstelle eine Organisation, um Veranstaltungen und Newsletter zu betreiben.'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Organisations'
subtitle: 'Gérez les organisations sous lesquelles vous organisez événements et newsletters.'
action:
  create: 'Créer une organisation'
status:
  PENDING: 'En attente de vérification'
  VERIFIED: 'Vérifiée'
  REJECTED: 'Refusée'
empty:
  title: 'Aucune organisation'
  description: 'Crée une organisation pour gérer des événements et des newsletters.'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Organizacje'
subtitle: 'Zarządzaj organizacjami, w ramach których prowadzisz wydarzenia i newslettery.'
action:
  create: 'Utwórz organizację'
status:
  PENDING: 'Oczekuje na weryfikację'
  VERIFIED: 'Zweryfikowana'
  REJECTED: 'Odrzucona'
empty:
  title: 'Brak organizacji'
  description: 'Utwórz organizację, aby prowadzić wydarzenia i newslettery.'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Organizace'
subtitle: 'Spravuj organizace, pod kterými pořádáš akce a newslettery.'
action:
  create: 'Vytvořit organizaci'
status:
  PENDING: 'Čeká na ověření'
  VERIFIED: 'Ověřená'
  REJECTED: 'Zamítnutá'
empty:
  title: 'Zatím žádné organizace'
  description: 'Vytvoř organizaci, abys mohl pořádat akce a newslettery.'
</i18n>
