<template>
  <div class="q-gutter-md q-pa-md">
    <password-settings-card @save="updateProfile" />

    <two-factor-settings-card />
  </div>
</template>

<script lang="ts" setup>
import PasswordSettingsCard from 'components/settings/PasswordSettingsCard.vue';
import { useProfileStore } from 'stores/profile-store.ts';
import { ProfileUpdateData } from '@camp-registration/common/entities';
import TwoFactorSettingsCard from 'components/settings/TwoFactorSettingsCard.vue';

const profileStore = useProfileStore();

function updateProfile(data: ProfileUpdateData) {
  profileStore.updateProfile(data);
}
</script>

<style scoped></style>
