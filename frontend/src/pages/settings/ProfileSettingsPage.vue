<template>
  <q-page
    padding
    class="q-gutter-md"
  >
    <template v-if="user">
      <profile-settings-card
        :profile="user"
        @save="updateProfile"
      />

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
  </q-page>
</template>

<script lang="ts" setup>
import { ProfileUpdateData } from '@camp-registration/common/entities';
import { useProfileStore } from 'stores/profile-store.ts';
import { storeToRefs } from 'pinia';
import ProfileSettingsCard from 'components/settings/ProfileSettingsCard.vue';
import EmailSettingsCard from 'components/settings/EmailSettingsCard.vue';

const profileStore = useProfileStore();
const { user } = storeToRefs(profileStore);

function updateProfile(data: ProfileUpdateData) {
  profileStore.updateProfile(data);
}
</script>

<style>
.settings-input {
  max-width: 450px;
}
</style>
