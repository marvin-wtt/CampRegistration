<template>
  <div
    v-if="grant"
    class="admin-access-bar row items-center no-wrap q-px-md q-py-xs"
    role="status"
    data-test="admin-access-bar"
  >
    <q-icon
      name="shield"
      size="xs"
      class="q-mr-sm"
    />
    <span class="col ellipsis text-body2">
      {{ t('label', { minutes: minutesLeft }) }}
    </span>
    <m-btn
      :label="t('end')"
      size="sm"
      text
      no-caps
      class="admin-access-bar__end"
      @click="endAccess()"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import {
  type AdminAccessSubject,
  useAdminAccess,
} from '@/composables/adminAccess';
import { useProfileStore } from '@/stores/profile-store';

const { subject } = defineProps<{
  subject: AdminAccessSubject;
}>();

const { t } = useI18n();
const profileStore = useProfileStore();
const { grant, endAccess } = useAdminAccess(() => subject);

const minutesLeft = computed<number>(() =>
  grant.value
    ? Math.max(
        1,
        Math.ceil(
          (new Date(grant.value.expiresAt).getTime() - profileStore.now) /
            60_000,
        ),
      )
    : 0,
);
</script>

<style scoped>
.admin-access-bar {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

.admin-access-bar__end {
  color: inherit;
}
</style>

<i18n lang="yaml" locale="en">
label: 'Administrator access · {minutes} min left'
end: 'End'
</i18n>

<i18n lang="yaml" locale="de">
label: 'Administratorzugriff · noch {minutes} Min.'
end: 'Beenden'
</i18n>

<i18n lang="yaml" locale="fr">
label: 'Accès administrateur · encore {minutes} min'
end: 'Terminer'
</i18n>

<i18n lang="yaml" locale="pl">
label: 'Dostęp administratora · zostało {minutes} min'
end: 'Zakończ'
</i18n>

<i18n lang="yaml" locale="cs">
label: 'Přístup administrátora · zbývá {minutes} min'
end: 'Ukončit'
</i18n>
