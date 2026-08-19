<template>
  <page-state-handler
    padding
    class="row justify-center"
  >
    <div class="settings-shell column col-12 col-sm-10 col-md-8 q-gutter-md">
      <div class="page-title">
        <div class="text-h5 text-weight-medium">{{ t('title') }}</div>
        <div class="text-body2 text-on-surface-variant q-mt-xs">
          {{ t('subtitle') }}
        </div>
      </div>

      <q-card
        flat
        bordered
        class="rounded-lg"
      >
        <q-card-section class="q-pb-none">
          <div class="row items-center no-wrap q-gutter-sm">
            <q-icon
              name="password"
              color="primary"
              size="20px"
            />
            <div class="text-subtitle2 text-weight-bold">
              {{ t('section.password.title') }}
            </div>
          </div>
          <div class="text-body2 text-on-surface-variant q-mt-xs">
            {{ t('section.password.hint') }}
          </div>
        </q-card-section>

        <password-settings-card @save="updateProfile" />
      </q-card>

      <q-card
        flat
        bordered
        class="rounded-lg"
      >
        <q-card-section class="q-pb-none">
          <div class="row items-center no-wrap q-gutter-sm">
            <q-icon
              name="shield"
              color="primary"
              size="20px"
            />
            <div class="text-subtitle2 text-weight-bold">
              {{ t('section.twoFactor.title') }}
            </div>
            <q-space />
            <q-chip
              dense
              square
              :icon="enabled ? 'check_circle' : 'remove_circle_outline'"
              class="status-chip"
              :class="enabled ? 'status-chip--on' : 'status-chip--off'"
            >
              {{
                enabled
                  ? t('section.twoFactor.statusOn')
                  : t('section.twoFactor.statusOff')
              }}
            </q-chip>
          </div>
          <div class="text-body2 text-on-surface-variant q-mt-xs">
            {{ t('section.twoFactor.hint') }}
          </div>
        </q-card-section>

        <template v-if="enabled">
          <two-factor-disable-card
            :loading
            :error
            @disable="disableTotp"
          />

          <q-separator />

          <two-factor-recovery-codes-card
            :codes="recoveryCodes"
            :loading
            :error
            @generate="generateRecoveryCodes"
            @done="clearRecoveryCodes"
          />
        </template>

        <two-factor-enable-card
          v-else-if="!!data?.secret && !!data?.url"
          :url="data.url"
          :secret="data.secret"
          :loading
          :error
          @enable="enableTotp"
        />

        <two-factor-setup-card
          v-else
          :loading
          @setup="onSetup"
        />
      </q-card>
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from '@/components/common/PageStateHandler.vue';
import PasswordSettingsCard from '@/components/settings/PasswordSettingsCard.vue';
import { useProfileStore } from '@/stores/profile-store';
import type { ProfileUpdateData } from '@camp-registration/common/entities';
import TwoFactorDisableCard from '@/components/settings/twoFactor/TwoFactorDisableCard.vue';
import { useTotpStore } from '@/stores/totp-store';
import { storeToRefs } from 'pinia';
import TwoFactorEnableCard from '@/components/settings/twoFactor/TwoFactorEnableCard.vue';
import TwoFactorSetupCard from '@/components/settings/twoFactor/TwoFactorSetupCard.vue';
import TwoFactorRecoveryCodesCard from '@/components/settings/twoFactor/TwoFactorRecoveryCodesCard.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const profileStore = useProfileStore();
const totpStore = useTotpStore();
const { loading, data, error, recoveryCodes } = storeToRefs(totpStore);

const enabled = computed<boolean>(() => {
  return profileStore.user?.twoFactorEnabled ?? false;
});

function updateProfile(data: ProfileUpdateData) {
  void profileStore.updateProfile(data);
}

function disableTotp(password: string, otp: string) {
  void totpStore.disableTotp(password, otp);
}

function enableTotp(otp: string) {
  void totpStore.enableTotp(otp);
}

function onSetup(password: string) {
  void totpStore.setupTotp(password);
}

function generateRecoveryCodes(password: string, otp: string) {
  void totpStore.generateRecoveryCodes(password, otp);
}

function clearRecoveryCodes() {
  totpStore.clearRecoveryCodes();
}
</script>

<style lang="scss" scoped>
.settings-shell {
  max-width: 60rem;
}

.status-chip {
  font-size: 12px;
  font-weight: 600;

  &--on {
    background: var(--md3-primary-container);
    color: var(--md3-on-primary-container);
  }

  &--off {
    background: var(--md3-surface-container-high);
    color: var(--md3-on-surface-variant);
  }
}
</style>

<i18n lang="yaml" locale="en">
title: 'Security'
subtitle: 'Keep your account protected against unauthorised access.'

section:
  password:
    title: 'Password'
    hint: 'Choose a password you do not use anywhere else.'
  twoFactor:
    title: 'Two-factor authentication'
    hint: 'Require a one-time code from your authenticator app in addition to your password.'
    statusOn: 'Enabled'
    statusOff: 'Disabled'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Sicherheit'
subtitle: 'Schützen Sie Ihr Konto vor unbefugtem Zugriff.'

section:
  password:
    title: 'Passwort'
    hint: 'Wählen Sie ein Passwort, das Sie nirgendwo sonst verwenden.'
  twoFactor:
    title: 'Zwei-Faktor-Authentifizierung'
    hint: 'Zusätzlich zum Passwort wird ein Einmalcode aus Ihrer Authentifizierungs-App verlangt.'
    statusOn: 'Aktiviert'
    statusOff: 'Deaktiviert'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Sécurité'
subtitle: 'Protégez votre compte contre les accès non autorisés.'

section:
  password:
    title: 'Mot de passe'
    hint: 'Choisissez un mot de passe que vous n’utilisez nulle part ailleurs.'
  twoFactor:
    title: 'Authentification à deux facteurs'
    hint: 'Exige un code à usage unique de votre application d’authentification en plus du mot de passe.'
    statusOn: 'Activée'
    statusOff: 'Désactivée'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Bezpieczeństwo'
subtitle: 'Chroń swoje konto przed nieautoryzowanym dostępem.'

section:
  password:
    title: 'Hasło'
    hint: 'Wybierz hasło, którego nie używasz nigdzie indziej.'
  twoFactor:
    title: 'Uwierzytelnianie dwuskładnikowe'
    hint: 'Oprócz hasła wymagany jest jednorazowy kod z aplikacji uwierzytelniającej.'
    statusOn: 'Włączone'
    statusOff: 'Wyłączone'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Zabezpečení'
subtitle: 'Chraňte svůj účet před neoprávněným přístupem.'

section:
  password:
    title: 'Heslo'
    hint: 'Zvolte heslo, které nepoužíváte nikde jinde.'
  twoFactor:
    title: 'Dvoufázové ověřování'
    hint: 'Kromě hesla je vyžadován jednorázový kód z vaší ověřovací aplikace.'
    statusOn: 'Zapnuto'
    statusOff: 'Vypnuto'
</i18n>
