<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="organization-review-card">
      <q-form @submit="onSubmit">
        <q-card-section class="row items-center no-wrap q-gutter-sm">
          <q-avatar
            :icon="isApproval ? 'verified' : 'cancel'"
            :class="isApproval ? 'avatar--approve' : 'avatar--reject'"
          />
          <div>
            <div class="text-h6">
              {{ t(`title.${variant}`) }}
            </div>
            <div class="text-body2 text-on-surface-variant">
              {{ organization.name }}
            </div>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="text-body2">
            {{ t(`message.${variant}`) }}
          </div>

          <q-input
            v-model="reviewNote"
            :label="isApproval ? t('note.optional') : t('note.required')"
            :hint="isApproval ? t('hint.approve') : t('hint.reject')"
            :rules="isApproval ? [] : [required]"
            type="textarea"
            rows="3"
            color="primary"
            hide-bottom-space
            rounded
            outlined
            autofocus
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
            :label="t(`action.${variant}`)"
            type="submit"
            :color="isApproval ? 'primary' : 'negative'"
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

const props = defineProps<{
  organization: Organization;
  decision: 'VERIFIED' | 'REJECTED';
}>();

/**
 * Reversing an existing decision reads differently from a first review:
 * "revoke" and "reinstate" rather than "reject" and "approve".
 */
const isReversal = computed(
  () => props.organization.verificationStatus !== 'PENDING',
);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();
defineEmits([...useDialogPluginComponent.emits]);

const isApproval = computed(() => props.decision === 'VERIFIED');

type Variant = 'approve' | 'reject' | 'reinstate' | 'revoke';

const variant = computed<Variant>(() => {
  if (isApproval.value) {
    return isReversal.value ? 'reinstate' : 'approve';
  }

  return isReversal.value ? 'revoke' : 'reject';
});
const reviewNote = ref<string>('');

// A rejection has to say why — the organization sees this note and needs to
// know what to correct before resubmitting.
const required = (val?: string | null) => !!val || t('rule.required');

function onSubmit() {
  onDialogOK(reviewNote.value || null);
}
</script>

<style lang="scss" scoped>
.organization-review-card {
  width: 460px;
  max-width: 90vw;
}

.avatar--approve {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.avatar--reject {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}
</style>

<i18n lang="yaml" locale="en">
title:
  approve: 'Approve organization'
  reject: 'Reject organization'
  reinstate: 'Reinstate organization'
  revoke: 'Revoke verification'
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
  approve: 'Approve'
  reject: 'Reject'
  reinstate: 'Reinstate'
  revoke: 'Revoke'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title:
  approve: 'Organisation genehmigen'
  reject: 'Organisation ablehnen'
  reinstate: 'Organisation wieder freigeben'
  revoke: 'Verifizierung entziehen'
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
  approve: 'Genehmigen'
  reject: 'Ablehnen'
  reinstate: 'Freigeben'
  revoke: 'Entziehen'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  approve: "Approuver l'organisation"
  reject: "Refuser l'organisation"
  reinstate: "Réintégrer l'organisation"
  revoke: 'Retirer la vérification'
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
  approve: 'Approuver'
  reject: 'Refuser'
  reinstate: 'Réintégrer'
  revoke: 'Retirer'
  cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
title:
  approve: 'Zatwierdź organizację'
  reject: 'Odrzuć organizację'
  reinstate: 'Przywróć organizację'
  revoke: 'Cofnij weryfikację'
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
  approve: 'Zatwierdź'
  reject: 'Odrzuć'
  reinstate: 'Przywróć'
  revoke: 'Cofnij'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
title:
  approve: 'Schválit organizaci'
  reject: 'Zamítnout organizaci'
  reinstate: 'Obnovit organizaci'
  revoke: 'Odebrat ověření'
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
  approve: 'Schválit'
  reject: 'Zamítnout'
  reinstate: 'Obnovit'
  revoke: 'Odebrat'
  cancel: 'Zrušit'
</i18n>
