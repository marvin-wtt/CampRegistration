<template>
  <q-card
    flat
    bordered
    class="attention-card"
    :class="{ 'attention-card--active': !loading && items.length > 0 }"
  >
    <q-card-section>
      <dashboard-card-header
        :icon="
          !loading && items.length === 0 ? 'task_alt' : 'notification_important'
        "
        :tone="loading ? 'primary' : items.length > 0 ? 'warning' : 'positive'"
        :title="t('title')"
      >
        <template #caption>
          <q-skeleton
            v-if="loading"
            type="text"
            width="40%"
          />
          <template v-else-if="items.length === 0">{{ t('empty') }}</template>
          <template v-else>{{ t('summary', items.length) }}</template>
        </template>
      </dashboard-card-header>
    </q-card-section>

    <q-card-section
      v-if="loading"
      class="attention-section"
    >
      <q-skeleton
        v-for="width in ['70%', '55%']"
        :key="width"
        type="text"
        :width="width"
      />
    </q-card-section>
    <q-card-section
      v-else-if="items.length > 0"
      class="attention-section"
    >
      <div class="attention-list">
        <button
          v-for="item in items"
          :key="item.key"
          type="button"
          class="attention-item"
          :data-test="`dashboard-attention-${item.key}`"
          @click="goToItem(item)"
        >
          <q-icon
            :name="item.icon"
            size="20px"
            class="attention-item__icon"
          />
          <span class="attention-item__label">{{ item.label }}</span>
          <span class="attention-item__count">{{ item.count }}</span>
          <q-icon
            name="chevron_right"
            size="18px"
            class="attention-item__chevron"
          />
        </button>
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import DashboardCardHeader from '@/components/event/dashboard/DashboardCardHeader.vue';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useEventFilesStore } from '@/stores/event-files-store';
import { useEventStatistics } from '@/composables/eventStatistics';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import type { EventPhase } from '@/composables/eventPhase';
import {
  LOCAL_TEMPLATE_AGE,
  LOCAL_TEMPLATE_MISSING,
  LOCAL_TEMPLATE_PENDING,
} from '@/components/event/table/localTableTemplates';

// Issues the app detects on its own; tasks people create live in TasksCard.
// The flags say which features the manager can see.
const {
  phase,
  loading = false,
  rooms = false,
} = defineProps<{
  phase: EventPhase;
  loading?: boolean;
  rooms?: boolean;
}>();

const { t } = useI18n();
const router = useRouter();
const eventDetailsStore = useEventDetailsStore();
const eventFilesStore = useEventFilesStore();
const stats = useEventStatistics();
const helper = useRegistrationHelper();

interface AttentionItem {
  key: string;
  label: string;
  count: number;
  icon: string;
  // Deep-links into the participants table via a hidden local template…
  template?: string;
  // …or navigates to another management route…
  route?: string;
  // …or scrolls to a section of this page.
  anchor?: string;
}

const items = computed<AttentionItem[]>(() => {
  const participants = stats.participants.value;
  const event = eventDetailsStore.data;
  const running = phase === 'running';

  const missingInfo = participants.filter(
    (r) => !helper.email(r) || !helper.fullName(r),
  ).length;

  const ageOutOfRange = participants.filter((r) => {
    const age = helper.age(r);
    if (age == null || event == null) {
      return false;
    }
    return age < event.minAge || age > event.maxAge;
  }).length;

  // Only nags once rooms are in use: plenty of events house no one.
  const accepted = stats.registrations.value.filter(
    (r) => r.status === 'ACCEPTED',
  );
  const withoutRoom = accepted.some((r) => r.room)
    ? accepted.filter((r) => !r.room).length
    : 0;

  const items: (AttentionItem & { shown: boolean })[] = [
    {
      key: 'pending',
      label: t('item.pending'),
      count: stats.counts.value.pending,
      icon: 'hourglass_top',
      template: LOCAL_TEMPLATE_PENDING,
      shown: true,
    },
    {
      key: 'rooms',
      label: t('item.rooms'),
      count: withoutRoom,
      icon: 'bed',
      route: 'management.event.room-planner',
      shown: running && rooms,
    },
    {
      key: 'missing',
      label: t('item.missing'),
      count: missingInfo,
      icon: 'contact_mail',
      template: LOCAL_TEMPLATE_MISSING,
      shown: true,
    },
    {
      key: 'age',
      label: t('item.age'),
      count: ageOutOfRange,
      icon: 'cake',
      template: LOCAL_TEMPLATE_AGE,
      shown: true,
    },
    {
      // The setup checklist covers files while setting up.
      key: 'files',
      label: t('item.files'),
      count: eventFilesStore.missingFilesCount,
      icon: 'upload_file',
      route: 'management.event.settings.files',
      shown: phase !== 'setup',
    },
  ];

  return items.filter((item) => item.shown && item.count > 0);
});

function goToItem(item: AttentionItem) {
  if (item.template) {
    void router.push({
      name: 'management.event.participants',
      query: { template: item.template },
    });
    return;
  }
  if (item.route) {
    void router.push({ name: item.route });
    return;
  }
  if (item.anchor) {
    document
      .getElementById(item.anchor)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
</script>

<style scoped>
.attention-card {
  border-radius: 16px;
}

.attention-card--active {
  border-color: color-mix(in srgb, var(--md3-warning) 45%, transparent);
}

.attention-section {
  padding-top: 0;
}

.attention-list {
  display: grid;
  gap: 6px;
}

.attention-item {
  display: flex;
  min-width: 0;
  min-height: 48px;
  align-items: center;
  gap: 12px;
  padding: 8px 8px 8px 12px;
  color: var(--md3-on-surface);
  font: inherit;
  text-align: left;
  cursor: pointer;
  background: color-mix(in srgb, var(--md3-warning) 6%, var(--md3-surface));
  border: 1px solid var(--md3-outline-variant);
  border-radius: 12px;
  transition:
    border-color 0.18s ease,
    background 0.18s ease;
}

.attention-item:hover,
.attention-item:focus-visible {
  background: var(--md3-surface-container-high);
  border-color: var(--md3-warning);
  outline: none;
}

.attention-item__icon {
  color: var(--md3-warning);
}

.attention-item__label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.875rem;
  font-weight: 500;
}

.attention-item__count {
  min-width: 24px;
  padding: 2px 8px;
  color: var(--md3-on-warning-container);
  font-size: 0.8125rem;
  font-weight: 700;
  text-align: center;
  background: var(--md3-warning-container);
  border-radius: 999px;
}

.attention-item__chevron {
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Needs attention'
empty: 'Nothing needs your attention'
summary: '{n} item to check | {n} items to check'
item:
  pending: 'Pending confirmations'
  rooms: 'Without a room'
  missing: 'Missing contact details'
  age: 'Age outside event range'
  files: 'Missing files'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Prüfen'
empty: 'Nichts zu prüfen'
summary: '{n} Punkt zu prüfen | {n} Punkte zu prüfen'
item:
  pending: 'Ausstehende Bestätigungen'
  rooms: 'Ohne Zimmer'
  missing: 'Fehlende Kontaktdaten'
  age: 'Alter außerhalb des Bereichs'
  files: 'Fehlende Dateien'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'À vérifier'
empty: 'Rien à vérifier'
summary: '{n} point à vérifier | {n} points à vérifier'
item:
  pending: 'Confirmations en attente'
  rooms: 'Sans chambre'
  missing: 'Coordonnées manquantes'
  age: 'Âge hors de la plage'
  files: 'Fichiers manquants'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Do sprawdzenia'
empty: 'Nic do sprawdzenia'
summary: '{n} sprawa do sprawdzenia | {n} sprawy do sprawdzenia'
item:
  pending: 'Oczekujące potwierdzenia'
  rooms: 'Bez pokoju'
  missing: 'Brakujące dane kontaktowe'
  age: 'Wiek poza zakresem'
  files: 'Brakujące pliki'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Ke kontrole'
empty: 'Nic ke kontrole'
summary: '{n} položka ke kontrole | {n} položky ke kontrole'
item:
  pending: 'Čekající potvrzení'
  rooms: 'Bez pokoje'
  missing: 'Chybějící kontaktní údaje'
  age: 'Věk mimo rozsah'
  files: 'Chybějící soubory'
</i18n>
