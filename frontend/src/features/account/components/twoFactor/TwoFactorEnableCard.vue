<template>
  <q-form @submit="onEnable">
    <q-card-section>
      <div class="text-body2 text-on-surface-variant q-mb-md">
        {{ t('description') }}
      </div>

      <div class="row q-col-gutter-md items-start">
        <div class="col-12 col-sm-auto">
          <div class="qr-frame">
            <qr-code
              :value="url"
              :margin="2"
            />
          </div>
        </div>

        <div class="col-12 col-sm column q-gutter-sm">
          <div>
            <div class="text-caption text-on-surface-variant">
              {{ t('secret') }}
            </div>
            <code class="secret-key">{{ secret }}</code>
          </div>

          <div class="text-body2 text-on-surface-variant">
            {{ t('secretInstructions') }}
          </div>

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
            color="primary"
            class="otp-field"
          >
            <template #prepend>
              <q-icon name="pin" />
            </template>
          </q-input>
        </div>
      </div>

      <q-banner
        v-if="error"
        dense
        class="error-banner rounded-md q-mt-md"
      >
        <template #avatar>
          <q-icon name="warning" />
        </template>
        {{ error }}
      </q-banner>
    </q-card-section>

    <q-card-actions>
      <m-btn
        :label="t('action.enable')"
        type="submit"
        color="primary"
        :loading
      />
    </q-card-actions>
  </q-form>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import QrCode from '@/components/common/QrCode.vue';

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

<style lang="scss" scoped>
// The QR needs a light ground to stay scannable in dark mode.
.qr-frame {
  display: inline-flex;
  padding: 8px;
  border-radius: 12px;
  background: #fff;
}

.secret-key {
  display: inline-block;
  font-family: monospace;
  font-size: 1rem;
  letter-spacing: 1px;
  padding: 6px 10px;
  border-radius: 8px;
  overflow-wrap: anywhere;
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface);
}

.otp-field {
  max-width: 14rem;
}

.error-banner {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}
</style>

<i18n lang="yaml" locale="en">
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
