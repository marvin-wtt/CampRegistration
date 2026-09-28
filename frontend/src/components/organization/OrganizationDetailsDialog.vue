<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="organization-details-card">
      <q-card-section class="q-pb-sm">
        <div class="row items-start no-wrap">
          <div class="col">
            <div class="text-h6">{{ organization.name }}</div>
            <div class="text-caption text-on-surface-variant">
              {{
                t('submitted', {
                  date: d(new Date(organization.submittedAt), 'short'),
                })
              }}
            </div>
          </div>
          <q-chip
            dense
            square
            :class="`status--${organization.verificationStatus.toLowerCase()}`"
          >
            {{ t(`status.${organization.verificationStatus}`) }}
          </q-chip>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="scroll details-body">
        <organization-details-panel :organization />
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          v-close-popup
          :label="t('action.close')"
          flat
          rounded
          no-caps
          color="primary"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Organization } from '@camp-registration/common/entities';
import OrganizationDetailsPanel from '@/components/organization/OrganizationDetailsPanel.vue';

defineProps<{ organization: Organization }>();

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const { t, d } = useI18n();
defineEmits([...useDialogPluginComponent.emits]);
</script>

<style lang="scss" scoped>
.organization-details-card {
  width: 560px;
  max-width: 90vw;
}

.details-body {
  max-height: 60vh;
}

.status--verified {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.status--pending {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.status--rejected {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}
</style>

<i18n lang="yaml" locale="en">
submitted: 'Submitted {date}'
status:
  PENDING: 'Awaiting review'
  VERIFIED: 'Verified'
  REJECTED: 'Rejected'
action:
  close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
submitted: 'Eingereicht am {date}'
status:
  PENDING: 'Wartet auf Prüfung'
  VERIFIED: 'Verifiziert'
  REJECTED: 'Abgelehnt'
action:
  close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
submitted: 'Soumise le {date}'
status:
  PENDING: 'En attente de contrôle'
  VERIFIED: 'Vérifiée'
  REJECTED: 'Refusée'
action:
  close: 'Fermer'
</i18n>

<i18n lang="yaml" locale="pl">
submitted: 'Zgłoszono {date}'
status:
  PENDING: 'Oczekuje na sprawdzenie'
  VERIFIED: 'Zweryfikowana'
  REJECTED: 'Odrzucona'
action:
  close: 'Zamknij'
</i18n>

<i18n lang="yaml" locale="cs">
submitted: 'Odesláno {date}'
status:
  PENDING: 'Čeká na kontrolu'
  VERIFIED: 'Ověřená'
  REJECTED: 'Zamítnutá'
action:
  close: 'Zavřít'
</i18n>
