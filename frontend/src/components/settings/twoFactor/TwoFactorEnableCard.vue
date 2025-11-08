<template>
  <q-card flat>
    <q-form
      @submit="onEnable"
      class="column q-gutter-sm"
    >
      <q-card-section class="text-h4">
        {{ t('title') }}
      </q-card-section>

      <q-card-section class="text-subtitle-2">
        {{ t('description') }}
      </q-card-section>

      <q-card-section class="q-gutter-sm">
        <qr-code
          :value="url"
          :margin="2"
        />

        <div>
          {{ t('secret') }}: <strong>{{ secret }}</strong>
        </div>
        <p>{{ t('secretInstructions') }}</p>

        <q-input
          v-model="otp"
          :label="t('field.otp.label')"
          :rules="[
            (val?: string) => !!val || t('field.otp.rule.required'),
            (val: string) => val.length === 6 || t('field.otp.rule.invalid'),
          ]"
          hide-bottom-space
          :disable="loading"
          mask="######"
          outlined
          rounded
          class="settings-input"
        >
          <template #before>
            <q-icon name="pin" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section
        v-if="error"
        class="text-negative q-ma-none q-py-xs"
      >
        {{ error }}
      </q-card-section>

      <q-card-actions>
        <q-btn
          :label="t('action.generate')"
          type="submit"
          color="primary"
          :loading
          outlined
          rounded
        />
      </q-card-actions>
    </q-form>
  </q-card>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import QrCode from 'components/common/QrCode.vue';

const { t } = useI18n();

const { loading, error } = defineProps<{
  url: string;
  secret: string;
  loading?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  (e: 'enable', otp: string): void;
}>();

const otp = ref<string>('');

function onEnable() {
  emit('enable', otp.value);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Two-Factor Authentication'
description: 'Secure your account by enabling two-factor authentication. Scan
  the QR code or use the secret key to set up your authenticator app, then enter
  the OTP to activate.'
secret: 'Secret Key'
secretInstructions: 'You can use this key to manually configure two-factor
  authentication if needed.'
field:
  otp:
    label: 'OTP'
    rule:
      required: 'OTP is required.'
      invalid: 'OTP must be 6 digits.'
action:
  enable: 'Enable 2FA'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Zwei-Faktor-Authentifizierung'
description: 'Sichern Sie Ihr Konto, indem Sie die Zwei-Faktor-Authentifizierung
  aktivieren. Scannen Sie den QR-Code oder verwenden Sie den geheimen Schlüssel,
  um Ihre Authentifizierungs-App einzurichten. Geben Sie dann das OTP ein, um die
  Aktivierung abzuschließen.'
secret: 'Geheimer Schlüssel'
secretInstructions: 'Sie können diesen Schlüssel verwenden, um die
  Zwei-Faktor-Authentifizierung manuell zu konfigurieren, falls erforderlich.'
field:
  otp:
    label: 'OTP'
    rule:
      required: 'OTP ist erforderlich.'
      invalid: 'OTP muss 6 Ziffern haben.'
action:
  enable: '2FA aktivieren'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Authentification à deux facteurs'
description: "Protégez votre compte en activant l'authentification à deux
  facteurs. Scannez le code QR ou utilisez la clé secrète pour configurer votre
  application d'authentification, puis saisissez l'OTP pour activer."
secret: 'Clé secrète'
secretInstructions: "Vous pouvez utiliser cette clé pour configurer manuellement
  l'authentification à deux facteurs si nécessaire."
field:
  otp:
    label: 'OTP'
    rule:
      required: "L'OTP est requis."
      invalid: "L'OTP doit contenir 6 chiffres."
action:
  enable: 'Activer 2FA'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Uwierzytelnianie dwuskładnikowe'
description: 'Zabezpiecz swoje konto, włączając uwierzytelnianie dwuskładnikowe. Zeskanuj kod QR lub użyj klucza tajnego, aby skonfigurować aplikację uwierzytelniającą. Następnie wprowadź kod OTP, aby zakończyć aktywację.'
secret: 'Klucz tajny'
secretInstructions: 'Możesz użyć tego klucza, aby ręcznie skonfigurować uwierzytelnianie dwuskładnikowe, jeśli to konieczne.'
field:
  otp:
    label: 'OTP'
    rule:
      required: 'Kod OTP jest wymagany.'
      invalid: 'Kod OTP musi składać się z 6 cyfr.'
action:
  enable: 'Włącz 2FA'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Dvoufázové ověřování'
description: 'Zabezpečte svůj účet aktivací dvoufázového ověřování. Naskenujte QR kód nebo použijte tajný klíč k nastavení ověřovací aplikace. Poté zadejte OTP kód pro dokončení aktivace.'
secret: 'Tajný klíč'
secretInstructions: 'Tento klíč můžete použít pro ruční nastavení dvoufázového ověřování, pokud je to nutné.'
field:
  otp:
    label: 'OTP'
    rule:
      required: 'OTP kód je povinný.'
      invalid: 'OTP kód musí mít 6 číslic.'
action:
  enable: 'Aktivovat 2FA'
</i18n>
