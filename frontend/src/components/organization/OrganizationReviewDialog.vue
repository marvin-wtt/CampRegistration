<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="organization-review-card">
      <q-form @submit="onSubmit">
        <q-card-section class="row items-center no-wrap q-gutter-sm">
          <q-avatar
            icon="rate_review"
            class="avatar--review"
          />
          <div class="col">
            <div class="section-label">{{ t('title') }}</div>
            <div class="text-h6">
              {{ organization.name }}
            </div>
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
        </q-card-section>

        <q-separator />

        <!-- Everything the decision rests on, the same view the details dialog
             shows — a moderator should never have to leave the dialog they
             decide in to see what they are deciding about. -->
        <q-card-section class="scroll review-body">
          <organization-details-panel
            :organization
            eager-notice
          />

          <q-separator class="q-my-md" />

          <div class="section-label q-mb-sm">{{ t('decision') }}</div>

          <q-option-group
            v-model="decision"
            :options
            type="radio"
            color="primary"
          >
            <template #label="opt">
              <div class="q-py-xs">
                <div class="row items-center q-gutter-xs">
                  <span class="text-weight-medium">{{ opt.label }}</span>
                  <q-badge
                    v-if="opt.current"
                    outline
                    color="primary"
                    :label="t('current')"
                  />
                </div>
                <div class="text-caption text-on-surface-variant">
                  {{ opt.description }}
                </div>
              </div>
            </template>
          </q-option-group>

          <q-input
            v-model="reviewNote"
            :label="isRejection ? t('note.required') : t('note.optional')"
            :hint="isRejection ? t('hint.reject') : t('hint.approve')"
            :rules="isRejection ? [required] : []"
            type="textarea"
            rows="3"
            color="primary"
            hide-bottom-space
            rounded
            outlined
            class="q-mt-md"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            :label="t('action.cancel')"
            flat
            rounded
            no-caps
            color="primary"
            @click="onDialogCancel"
          />
          <q-btn
            :label="submitLabel"
            :color="isRejection ? 'negative' : 'primary'"
            :disable="decision === null"
            type="submit"
            unelevated
            rounded
            no-caps
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Organization } from '@camp-registration/common/entities';
import OrganizationDetailsPanel from '@/components/organization/OrganizationDetailsPanel.vue';

export type OrganizationReviewDecision = 'VERIFIED' | 'REJECTED';

export interface OrganizationReviewResult {
  status: OrganizationReviewDecision;
  reviewNote: string | null;
}

const props = defineProps<{
  organization: Organization;
}>();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t, d } = useI18n();
defineEmits([...useDialogPluginComponent.emits]);

// Nothing is preselected: a review is a deliberate choice, and preselecting the
// decision already in force would let an accidental submit re-notify the
// organization about a decision that never changed.
const decision = ref<OrganizationReviewDecision | null>(null);
const reviewNote = ref<string>('');

const isRejection = computed(() => decision.value === 'REJECTED');

const status = computed(() => props.organization.verificationStatus);

/**
 * Reversing a decision reads differently from a first review: "revoke" and
 * "reinstate" rather than "reject" and "approve".
 */
type Variant = 'approve' | 'reject' | 'reinstate' | 'revoke';

const approveVariant = computed<Variant>(() =>
  status.value === 'REJECTED' ? 'reinstate' : 'approve',
);
const rejectVariant = computed<Variant>(() =>
  status.value === 'VERIFIED' ? 'revoke' : 'reject',
);

// The decision already in force stays on screen as context but cannot be
// re-applied — it would change nothing and mail the organization again.
const options = computed(() => [
  {
    value: 'VERIFIED',
    label: t(`action.${approveVariant.value}`),
    description: t(`message.${approveVariant.value}`),
    current: status.value === 'VERIFIED',
    disable: status.value === 'VERIFIED',
  },
  {
    value: 'REJECTED',
    label: t(`action.${rejectVariant.value}`),
    description: t(`message.${rejectVariant.value}`),
    current: status.value === 'REJECTED',
    disable: status.value === 'REJECTED',
  },
]);

const submitLabel = computed<string>(() => {
  if (decision.value === null) {
    return t('action.submit');
  }

  return isRejection.value
    ? t(`action.${rejectVariant.value}`)
    : t(`action.${approveVariant.value}`);
});

// A rejection has to say why — the organization sees this note and needs to
// know what to correct before resubmitting.
const required = (val?: string | null) => !!val || t('rule.required');

function onSubmit() {
  if (decision.value === null) {
    return;
  }

  onDialogOK({
    status: decision.value,
    reviewNote: reviewNote.value || null,
  } satisfies OrganizationReviewResult);
}
</script>

<style lang="scss" scoped>
.organization-review-card {
  width: 560px;
  max-width: 90vw;
}

.review-body {
  max-height: 60vh;
}

.section-label {
  color: var(--md3-on-surface-variant);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.avatar--review {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
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
title: 'Review organization'
current: 'Current'
submitted: 'Submitted {date}'
decision: 'Decision'
status:
  PENDING: 'Awaiting review'
  VERIFIED: 'Verified'
  REJECTED: 'Rejected'
message:
  approve: 'It will be able to publish camps and send newsletters.'
  reject: 'It will not be able to publish camps or send newsletters. Its camps stay private drafts.'
  reinstate: 'It will be able to publish camps and send newsletters again.'
  revoke: 'It can no longer publish camps or send newsletters, and any public camps are unpublished immediately.'
note:
  optional: 'Note (optional)'
  required: 'Reason for rejection'
hint:
  approve: 'Shared with the organization'
  reject: 'Shown to the organization so they can correct and resubmit'
rule:
  required: 'Please give a reason'
action:
  submit: 'Save decision'
  approve: 'Approve'
  reject: 'Reject'
  reinstate: 'Reinstate'
  revoke: 'Revoke verification'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Organisation prüfen'
current: 'Aktuell'
submitted: 'Eingereicht am {date}'
decision: 'Entscheidung'
status:
  PENDING: 'Wartet auf Prüfung'
  VERIFIED: 'Verifiziert'
  REJECTED: 'Abgelehnt'
message:
  approve: 'Sie kann dann Camps veröffentlichen und Newsletter versenden.'
  reject: 'Sie kann keine Camps veröffentlichen und keine Newsletter versenden. Ihre Camps bleiben private Entwürfe.'
  reinstate: 'Sie kann wieder Camps veröffentlichen und Newsletter versenden.'
  revoke: 'Sie kann keine Camps mehr veröffentlichen oder Newsletter versenden; öffentliche Camps werden sofort zurückgezogen.'
note:
  optional: 'Hinweis (optional)'
  required: 'Grund für die Ablehnung'
hint:
  approve: 'Wird der Organisation mitgeteilt'
  reject: 'Wird der Organisation angezeigt, damit sie korrigieren und erneut einreichen kann'
rule:
  required: 'Bitte gib einen Grund an'
action:
  submit: 'Entscheidung speichern'
  approve: 'Genehmigen'
  reject: 'Ablehnen'
  reinstate: 'Freigeben'
  revoke: 'Verifizierung entziehen'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: "Contrôler l'organisation"
current: 'Actuel'
submitted: 'Soumise le {date}'
decision: 'Décision'
status:
  PENDING: 'En attente de contrôle'
  VERIFIED: 'Vérifiée'
  REJECTED: 'Refusée'
message:
  approve: 'Elle pourra publier des camps et envoyer des newsletters.'
  reject: 'Elle ne pourra pas publier de camps ni envoyer de newsletters. Ses camps restent des brouillons privés.'
  reinstate: 'Elle pourra à nouveau publier des camps et envoyer des newsletters.'
  revoke: 'Elle ne peut plus publier de camps ni envoyer de newsletters ; les camps publics sont dépubliés immédiatement.'
note:
  optional: 'Note (optionnel)'
  required: 'Motif du refus'
hint:
  approve: "Communiqué à l'organisation"
  reject: "Affiché à l'organisation pour qu'elle corrige et resoumette"
rule:
  required: 'Indique un motif'
action:
  submit: 'Enregistrer la décision'
  approve: 'Approuver'
  reject: 'Refuser'
  reinstate: 'Réintégrer'
  revoke: 'Retirer la vérification'
  cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Sprawdź organizację'
current: 'Obecnie'
submitted: 'Zgłoszono {date}'
decision: 'Decyzja'
status:
  PENDING: 'Oczekuje na sprawdzenie'
  VERIFIED: 'Zweryfikowana'
  REJECTED: 'Odrzucona'
message:
  approve: 'Będzie mogła publikować obozy i wysyłać newslettery.'
  reject: 'Nie będzie mogła publikować obozów ani wysyłać newsletterów. Jej obozy pozostaną prywatnymi wersjami roboczymi.'
  reinstate: 'Będzie mogła ponownie publikować obozy i wysyłać newslettery.'
  revoke: 'Nie będzie mogła publikować obozów ani wysyłać newsletterów, a publiczne obozy zostaną natychmiast wycofane.'
note:
  optional: 'Uwaga (opcjonalnie)'
  required: 'Powód odrzucenia'
hint:
  approve: 'Zostanie przekazane organizacji'
  reject: 'Wyświetlane organizacji, aby mogła poprawić i zgłosić ponownie'
rule:
  required: 'Podaj powód'
action:
  submit: 'Zapisz decyzję'
  approve: 'Zatwierdź'
  reject: 'Odrzuć'
  reinstate: 'Przywróć'
  revoke: 'Cofnij weryfikację'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Zkontrolovat organizaci'
current: 'Aktuální'
submitted: 'Odesláno {date}'
decision: 'Rozhodnutí'
status:
  PENDING: 'Čeká na kontrolu'
  VERIFIED: 'Ověřená'
  REJECTED: 'Zamítnutá'
message:
  approve: 'Bude moci zveřejňovat tábory a posílat newslettery.'
  reject: 'Nebude moci zveřejňovat tábory ani posílat newslettery. Její tábory zůstanou soukromými koncepty.'
  reinstate: 'Bude moci znovu zveřejňovat tábory a posílat newslettery.'
  revoke: 'Nebude moci zveřejňovat tábory ani posílat newslettery a veřejné tábory budou okamžitě staženy.'
note:
  optional: 'Poznámka (volitelné)'
  required: 'Důvod zamítnutí'
hint:
  approve: 'Sdíleno s organizací'
  reject: 'Zobrazí se organizaci, aby mohla opravit a znovu odeslat'
rule:
  required: 'Uveď prosím důvod'
action:
  submit: 'Uložit rozhodnutí'
  approve: 'Schválit'
  reject: 'Zamítnout'
  reinstate: 'Obnovit'
  revoke: 'Odebrat ověření'
  cancel: 'Zrušit'
</i18n>
