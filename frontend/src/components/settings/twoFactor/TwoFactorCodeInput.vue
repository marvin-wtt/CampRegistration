<template>
  <q-input
    v-model="model"
    v-bind="attrs"
    :key="String(useRecovery)"
    :label="useRecovery ? t('field.recoveryCode.label') : t('field.otp.label')"
    :rules="rules"
    :mask="useRecovery ? undefined : '######'"
  >
    <template #before>
      <q-icon :name="useRecovery ? 'vpn_key' : 'pin'" />
    </template>
  </q-input>

  <div>
    <q-btn
      :label="useRecovery ? t('recovery.useApp') : t('recovery.useCode')"
      :icon="useRecovery ? 'smartphone' : 'vpn_key'"
      color="primary"
      flat
      dense
      no-caps
      rounded
      size="md"
      class="q-px-sm"
      @click="onToggle"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, useAttrs } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ValidationRule } from 'quasar';

defineOptions({
  inheritAttrs: false,
});

const { t } = useI18n();
const attrs = useAttrs();

const model = defineModel<string>({ required: true });

const useRecovery = ref<boolean>(false);

const rules = computed<ValidationRule[]>(() =>
  useRecovery.value
    ? [(val?: string) => !!val || t('field.recoveryCode.rule.required')]
    : [
        (val?: string) => !!val || t('field.otp.rule.required'),
        (val: string) => val.length === 6 || t('field.otp.rule.invalid'),
      ],
);

function onToggle() {
  useRecovery.value = !useRecovery.value;
  model.value = '';
}
</script>

<i18n lang="yaml" locale="en">
field:
  otp:
    label: 'OTP'
    rule:
      required: 'OTP is required.'
      invalid: 'OTP must be 6 digits.'
  recoveryCode:
    label: 'Recovery code'
    rule:
      required: 'Recovery code is required.'

recovery:
  useCode: 'Use a recovery code instead'
  useApp: 'Use your authenticator app instead'
</i18n>

<i18n lang="yaml" locale="de">
field:
  otp:
    label: 'OTP'
    rule:
      required: 'OTP ist erforderlich.'
      invalid: 'OTP muss 6 Ziffern haben.'
  recoveryCode:
    label: 'Wiederherstellungscode'
    rule:
      required: 'Wiederherstellungscode ist erforderlich.'

recovery:
  useCode: 'Stattdessen einen Wiederherstellungscode verwenden'
  useApp: 'Stattdessen die Authentifizierungs-App verwenden'
</i18n>

<i18n lang="yaml" locale="fr">
field:
  otp:
    label: 'OTP'
    rule:
      required: "L'OTP est requis."
      invalid: "L'OTP doit contenir 6 chiffres."
  recoveryCode:
    label: 'Code de récupération'
    rule:
      required: 'Le code de récupération est requis.'

recovery:
  useCode: 'Utiliser plutôt un code de récupération'
  useApp: "Utiliser plutôt votre application d'authentification"
</i18n>

<i18n lang="yaml" locale="pl">
field:
  otp:
    label: 'OTP'
    rule:
      required: 'Kod OTP jest wymagany.'
      invalid: 'Kod OTP musi składać się z 6 cyfr.'
  recoveryCode:
    label: 'Kod odzyskiwania'
    rule:
      required: 'Kod odzyskiwania jest wymagany.'

recovery:
  useCode: 'Użyj zamiast tego kodu odzyskiwania'
  useApp: 'Użyj zamiast tego aplikacji uwierzytelniającej'
</i18n>

<i18n lang="yaml" locale="cs">
field:
  otp:
    label: 'OTP'
    rule:
      required: 'OTP kód je povinný.'
      invalid: 'OTP kód musí mít 6 číslic.'
  recoveryCode:
    label: 'Kód pro obnovení'
    rule:
      required: 'Kód pro obnovení je povinný.'

recovery:
  useCode: 'Použít místo toho kód pro obnovení'
  useApp: 'Použít místo toho autentizační aplikaci'
</i18n>
