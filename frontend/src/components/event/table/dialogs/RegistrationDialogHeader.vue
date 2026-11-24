<template>
  <div class="dialog-header row items-center no-wrap">
    <q-avatar
      class="header-avatar rounded-lg"
      size="56px"
      square
    >
      {{ initials }}
    </q-avatar>

    <div class="col q-ml-md column justify-center overflow-hidden">
      <div class="header-name ellipsis">
        {{ personName }}
        <q-tooltip>{{ personName }}</q-tooltip>
      </div>
      <div class="row items-center no-wrap q-mt-xs">
        <span
          class="status-pill rounded-full"
          :style="statusStyle"
        >
          <q-icon
            :name="statusIcon"
            size="14px"
          />
          {{ statusLabel }}
        </span>
        <span
          class="date-pill rounded-full q-ml-xs"
          :aria-label="registeredOn"
        >
          <q-icon
            name="event"
            size="14px"
          />
          {{ d(registration.createdAt, 'date') }}
          <q-tooltip>{{ registeredOn }}</q-tooltip>
        </span>
      </div>
    </div>

    <!-- Trailing actions (menu, close, …) -->
    <div class="row items-center no-wrap self-start">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import type { Registration } from '@camp-registration/common/entities';

const { registration } = defineProps<{
  registration: Registration;
}>();

const { t, d } = useI18n();

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

const statusIcon = computed<string>(() => {
  switch (registration.status) {
    case 'ACCEPTED':
      return 'check_circle';
    case 'PENDING':
      return 'schedule';
    case 'WAITLISTED':
    default:
      return 'hourglass_empty';
  }
});

const registeredOn = computed<string>(() =>
  t('registeredOn', { date: d(registration.createdAt, 'date') }),
);

const statusStyle = computed(() => ({
  backgroundColor: `var(--md3-${statusRole.value}-container)`,
  color: `var(--md3-on-${statusRole.value}-container)`,
}));

const statusLabel = computed<string>(() => {
  return t(`status.${registration.status.toLowerCase()}`);
});
</script>

<style scoped lang="scss">
/* Part of the card's surface rather than a band of its own. */
.dialog-header {
  padding: 20px 12px 12px 20px;
}

.header-avatar {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
  font-weight: 600;
  font-size: 20px;
}

.header-name {
  font-size: 1.375rem;
  line-height: 1.75rem;
  font-weight: 500;
  color: var(--md3-on-surface);
}

.status-pill,
.date-pill {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 10px 0 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.date-pill {
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
  font-weight: 500;
}
</style>

<i18n lang="yaml" locale="en">
registeredOn: 'Registered on {date}'
status:
  pending: 'Pending'
  waitlisted: 'Waitlisted'
  accepted: 'Accepted'
</i18n>

<i18n lang="yaml" locale="de">
registeredOn: 'Angemeldet am {date}'
status:
  pending: 'Ausstehend'
  waitlisted: 'Warteliste'
  accepted: 'Akzeptiert'
</i18n>

<i18n lang="yaml" locale="fr">
registeredOn: 'Inscrit le {date}'
status:
  pending: 'En attente'
  waitlisted: "Liste d'attente"
  accepted: 'Accepté'
</i18n>

<i18n lang="yaml" locale="pl">
registeredOn: 'Zgłoszono {date}'
status:
  pending: 'Oczekuje'
  waitlisted: 'Lista oczekujących'
  accepted: 'Zaakceptowano'
</i18n>

<i18n lang="yaml" locale="cs">
registeredOn: 'Registrováno {date}'
status:
  pending: 'Čeká na schválení'
  waitlisted: 'Na čekací listině'
  accepted: 'Přijato'
</i18n>
