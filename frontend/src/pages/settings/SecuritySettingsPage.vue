<template>
  <q-page
    padding
    class="q-gutter-md"
  >
    <password-settings-card @save="updateProfile" />

    <two-factor-settings-card />
  </q-page>
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

<style>
.settings-input {
  max-width: 450px;
}
</style>
