<template>
  <div class="q-gutter-md q-pa-md">
    <password-settings-card @save="updateProfile" />

    <two-factor-disable-card
      v-if="enabled"
      :loading
      :error
      @disable="disableTotp"
    />

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
  </div>
</template>

<script lang="ts" setup>
import PasswordSettingsCard from 'components/settings/PasswordSettingsCard.vue';
import { useProfileStore } from 'stores/profile-store';
import type { ProfileUpdateData } from '@camp-registration/common/entities';
import TwoFactorDisableCard from 'components/settings/twoFactor/TwoFactorDisableCard.vue';
import { useTotpStore } from 'stores/totp-store';
import { storeToRefs } from 'pinia';
import TwoFactorEnableCard from 'components/settings/twoFactor/TwoFactorEnableCard.vue';
import TwoFactorSetupCard from 'components/settings/twoFactor/TwoFactorSetupCard.vue';
import { computed } from 'vue';

const profileStore = useProfileStore();
const totpStore = useTotpStore();
const { loading, data, error } = storeToRefs(totpStore);

const enabled = computed<boolean>(() => {
  return profileStore.user?.twoFactorEnabled ?? false;
});

function updateProfile(data: ProfileUpdateData) {
  profileStore.updateProfile(data);
}

function disableTotp(password: string, otp: string) {
  totpStore.disableTotp(password, otp);
}

function enableTotp(otp: string) {
  totpStore.enableTotp(otp);
}

function onSetup(password: string) {
  totpStore.setupTotp(password);
}
</script>

<style scoped></style>
