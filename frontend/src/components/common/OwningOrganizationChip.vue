<template>
  <div class="owning-organization row items-center no-wrap">
    <q-icon
      name="apartment"
      size="18px"
      class="owning-organization__icon"
    />

    <!-- Managing a camp or newsletter does not imply membership in the owning
         organization, so the name is only a link when the user may open it. -->
    <router-link
      v-if="target"
      :to="target"
      class="owning-organization__link ellipsis"
    >
      {{ organizationName }}
    </router-link>
    <span
      v-else
      class="ellipsis"
    >
      {{ organizationName }}
    </span>

    <q-badge
      v-if="verificationStatus !== 'VERIFIED'"
      color="warning"
      text-color="dark"
      class="q-ml-sm"
    >
      {{ t('unverified') }}
      <q-tooltip max-width="280px">
        {{ subject === 'camp' ? t('hint.camp') : t('hint.newsletter') }}
      </q-tooltip>
    </q-badge>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RouteLocationRaw } from 'vue-router';
import { useOrganizationPermissions } from '@/composables/organizationPermissions';
import type { OrganizationVerificationStatus } from '@camp-registration/common/entities';

const { organizationId, subject } = defineProps<{
  organizationId: string;
  organizationName: string;
  verificationStatus: OrganizationVerificationStatus;
  subject: 'camp' | 'newsletter';
}>();

const { t } = useI18n();
const { canOrgFor } = useOrganizationPermissions();

const target = computed<RouteLocationRaw | undefined>(() =>
  canOrgFor(organizationId, 'organization.view')
    ? { name: 'management.organization', params: { organizationId } }
    : undefined,
);
</script>

<style scoped>
.owning-organization {
  min-width: 0;
  font-size: 0.875rem;
  color: var(--md3-on-surface-variant);
}

.owning-organization__icon {
  margin-right: 6px;
  flex: 0 0 auto;
}

.owning-organization__link {
  color: inherit;
  text-decoration: none;
}

.owning-organization__link:hover {
  color: var(--md3-primary);
  text-decoration: underline;
}
</style>

<i18n lang="yaml" locale="en">
unverified: 'Not verified'
hint:
  camp: 'This camp stays out of the public directory and refuses registrations until the organization is verified.'
  newsletter: 'This newsletter cannot send messages until the organization is verified.'
</i18n>

<i18n lang="yaml" locale="de">
unverified: 'Nicht verifiziert'
hint:
  camp: 'Dieses Camp erscheint nicht im öffentlichen Verzeichnis und nimmt keine Anmeldungen an, bis die Organisation verifiziert ist.'
  newsletter: 'Dieser Newsletter kann keine Nachrichten versenden, bis die Organisation verifiziert ist.'
</i18n>

<i18n lang="yaml" locale="fr">
unverified: 'Non vérifiée'
hint:
  camp: "Ce camp n'apparaît pas dans l'annuaire public et refuse les inscriptions tant que l'organisation n'est pas vérifiée."
  newsletter: "Cette newsletter ne peut pas envoyer de messages tant que l'organisation n'est pas vérifiée."
</i18n>

<i18n lang="yaml" locale="pl">
unverified: 'Niezweryfikowana'
hint:
  camp: 'Ten obóz nie pojawia się w publicznym katalogu i nie przyjmuje zgłoszeń, dopóki organizacja nie zostanie zweryfikowana.'
  newsletter: 'Ten newsletter nie może wysyłać wiadomości, dopóki organizacja nie zostanie zweryfikowana.'
</i18n>

<i18n lang="yaml" locale="cs">
unverified: 'Neověřeno'
hint:
  camp: 'Tento tábor se nezobrazuje ve veřejném katalogu a nepřijímá registrace, dokud nebude organizace ověřena.'
  newsletter: 'Tento newsletter nemůže odesílat zprávy, dokud nebude organizace ověřena.'
</i18n>
