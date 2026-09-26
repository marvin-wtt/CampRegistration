<template>
  <div class="dialog-header row items-center no-wrap">
    <q-avatar
      class="header-avatar"
      size="48px"
    >
      {{ initials }}
    </q-avatar>

    <div class="col q-ml-md column justify-center overflow-hidden">
      <div class="text-subtitle1 text-weight-medium ellipsis">
        {{ personName }}
      </div>
      <div class="row items-center no-wrap q-mt-xs">
        <span
          class="status-pill"
          :style="statusStyle"
        >
          {{ statusLabel }}
        </span>
      </div>
    </div>

    <!-- Trailing actions (menu, close, …) -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import type { Registration } from '@camp-registration/common/entities';

const { registration } = defineProps<{
  registration: Registration;
}>();

const { t } = useI18n();

const personName = computed<string>(() => {
  const firstName = registration.computedData.firstName?.trim() ?? '';
  const lastName = registration.computedData.lastName?.trim() ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName.length > 0 ? fullName : '?';
});

const initials = computed<string>(() => {
  const first = registration.computedData.firstName?.trim()?.[0] ?? '';
  const last = registration.computedData.lastName?.trim()?.[0] ?? '';
  const result = `${first}${last}`.toUpperCase();
  return result.length > 0 ? result : '?';
});

// Maps a status to one of the MD3 color roles (each exposes matching
// `--md3-<role>-container` / `--md3-on-<role>-container` tokens).
const statusRole = computed<string>(() => {
  switch (registration.status) {
    case 'ACCEPTED':
      return 'positive';
    case 'PENDING':
      return 'info';
    case 'WAITLISTED':
    default:
      return 'warning';
  }
});

const statusStyle = computed(() => ({
  backgroundColor: `var(--md3-${statusRole.value}-container)`,
  color: `var(--md3-on-${statusRole.value}-container)`,
}));

const statusLabel = computed<string>(() => {
  return t(`status.${registration.status.toLowerCase()}`);
});
</script>

<style scoped lang="scss">
.dialog-header {
  padding: 16px 12px 16px 20px;
  background: var(--md3-surface-container);
}

.header-avatar {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
  font-weight: 600;
  font-size: 18px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}
</style>

<i18n lang="yaml" locale="en">
status:
  pending: 'Pending'
  waitlisted: 'Waitlisted'
  accepted: 'Accepted'
</i18n>

<i18n lang="yaml" locale="de">
status:
  pending: 'Ausstehend'
  waitlisted: 'Warteliste'
  accepted: 'Akzeptiert'
</i18n>

<i18n lang="yaml" locale="fr">
status:
  pending: 'En attente'
  waitlisted: "Liste d'attente"
  accepted: 'Accepté'
</i18n>

<i18n lang="yaml" locale="pl">
status:
  pending: 'Oczekuje'
  waitlisted: 'Lista oczekujących'
  accepted: 'Zaakceptowano'
</i18n>

<i18n lang="yaml" locale="cs">
status:
  pending: 'Čeká na schválení'
  waitlisted: 'Na čekací listině'
  accepted: 'Přijato'
</i18n>
