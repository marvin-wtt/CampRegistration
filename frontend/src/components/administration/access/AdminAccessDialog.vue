<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="access-card">
      <q-form @submit="onSubmit">
        <q-card-section class="q-pb-none">
          <div class="row items-center no-wrap q-gutter-x-sm">
            <q-icon
              name="shield"
              size="sm"
              color="error"
            />
            <div class="text-h6">{{ t('title') }}</div>
          </div>
          <div class="text-body2 text-on-surface-variant q-mt-sm">
            {{ t('message', { minutes: ADMIN_ACCESS_GRANT_MINUTES }) }}
          </div>
        </q-card-section>

        <q-card-section class="q-gutter-y-md">
          <q-input
            v-model="reason"
            :label="t('field.reason')"
            :hint="t('hint.reason')"
            :rules="[
              (val?: string) =>
                (val?.trim().length ?? 0) >= 3 || t('rule.reason'),
            ]"
            type="textarea"
            autogrow
            maxlength="500"
            outlined
            rounded
            autofocus
            data-test="admin-access-reason"
          />

          <two-factor-code-input
            v-model="otp"
            data-test="admin-access-otp"
          />

          <q-banner
            v-if="error"
            dense
            class="error-note rounded-md"
          >
            {{ error }}
          </q-banner>
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
            :label="t('action.request')"
            :loading
            type="submit"
            color="error"
            unelevated
            rounded
            no-caps
            data-test="admin-access-submit"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { ADMIN_ACCESS_GRANT_MINUTES } from '@camp-registration/common/entities';
import type { PermissionScope } from '@camp-registration/common/permissions';
import TwoFactorCodeInput from '@/components/settings/twoFactor/TwoFactorCodeInput.vue';
import { useProfileStore } from '@/stores/profile-store';
import { useErrorExtractor } from '@/composables/errorText';

const { scope, scopeId } = defineProps<{
  scope: PermissionScope;
  scopeId: string;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();
const profileStore = useProfileStore();
const { extractErrorText } = useErrorExtractor();

const reason = ref('');
const otp = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

async function onSubmit() {
  loading.value = true;
  error.value = null;
  try {
    await profileStore.requestAdminAccess({
      scope,
      scopeId,
      reason: reason.value.trim(),
      otp: otp.value,
    });
    onDialogOK();
  } catch (err) {
    error.value = extractErrorText(err);
    otp.value = '';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.access-card {
  width: 480px;
  max-width: 90vw;
}

.error-note {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Request administrator access'
message: 'You get every permission here for {minutes} minutes. Your access and its reason are recorded for review.'
field:
  reason: 'Reason'
hint:
  reason: 'For example the support ticket you are working on'
rule:
  reason: 'Please give a reason'
action:
  cancel: 'Cancel'
  request: 'Request access'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Administratorzugriff anfordern'
message: 'Du erhältst hier für {minutes} Minuten alle Berechtigungen. Dein Zugriff und der Grund werden zur Überprüfung protokolliert.'
field:
  reason: 'Grund'
hint:
  reason: 'Zum Beispiel die Support-Anfrage, die du bearbeitest'
rule:
  reason: 'Bitte gib einen Grund an'
action:
  cancel: 'Abbrechen'
  request: 'Zugriff anfordern'
</i18n>

<i18n lang="yaml" locale="fr">
title: "Demander l'accès administrateur"
message: 'Vous obtenez ici toutes les autorisations pendant {minutes} minutes. Votre accès et son motif sont enregistrés pour vérification.'
field:
  reason: 'Motif'
hint:
  reason: "Par exemple la demande d'assistance que vous traitez"
rule:
  reason: 'Veuillez indiquer un motif'
action:
  cancel: 'Annuler'
  request: "Demander l'accès"
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Poproś o dostęp administratora'
message: 'Otrzymujesz tu wszystkie uprawnienia na {minutes} minut. Dostęp i jego powód są rejestrowane do weryfikacji.'
field:
  reason: 'Powód'
hint:
  reason: 'Na przykład zgłoszenie, nad którym pracujesz'
rule:
  reason: 'Podaj powód'
action:
  cancel: 'Anuluj'
  request: 'Poproś o dostęp'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Požádat o přístup administrátora'
message: 'Získáte zde všechna oprávnění na {minutes} minut. Přístup a jeho důvod se zaznamenávají ke kontrole.'
field:
  reason: 'Důvod'
hint:
  reason: 'Například požadavek na podporu, na kterém pracujete'
rule:
  reason: 'Uveďte prosím důvod'
action:
  cancel: 'Zrušit'
  request: 'Požádat o přístup'
</i18n>
