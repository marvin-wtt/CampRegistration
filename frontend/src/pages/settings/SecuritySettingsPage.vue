<template>
  <div class="q-gutter-md q-pa-md">
    <template v-if="enabled">
      <two-factor-disable-card
        :loading
        :error
        @disable="disableTotp"
      />

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

    <password-settings-card @save="updateProfile" />
  </div>
</template>

<script lang="ts" setup>
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

<style scoped></style>
