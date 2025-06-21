<template>
  <div class="q-gutter-md q-pa-md">
    <template v-if="user">
      <profile-settings-card
        :profile="user"
        @save="updateProfile"
      />

      <q-separator inset />

      <email-settings-card
        :profile="user"
        @save="updateProfile"
      />
    </template>

    <q-inner-loading
      v-else
      color="primary"
      size="xl"
      showing
    />
  </div>
</template>

<script lang="ts" setup>
import type { ProfileUpdateData } from '@camp-registration/common/entities';
import { useProfileStore } from 'stores/profile-store';
import { storeToRefs } from 'pinia';
import ProfileSettingsCard from 'components/settings/ProfileSettingsCard.vue';
import EmailSettingsCard from 'components/settings/EmailSettingsCard.vue';

const profileStore = useProfileStore();
const { user } = storeToRefs(profileStore);

function updateProfile(data: ProfileUpdateData) {
  profileStore.updateProfile(data);
}
</script>

<style scoped></style>
