<template>
  <q-card
    class="mgmt-card"
    :class="`mgmt-card--${tone}`"
  >
    <!-- Header: monogram, title, timing, overflow -->
    <div
      class="mgmt-card__head"
      role="link"
      tabindex="0"
      :aria-label="to(event.name)"
      @click="openEvent"
      @keyup.enter="openEvent"
    >
      <span
        class="mgmt-card__avatar"
        aria-hidden="true"
      >
        {{ monogram }}
      </span>

      <div class="mgmt-card__heading">
        <div
          ref="titleRef"
          class="mgmt-card__title ellipsis-2-lines"
          @mouseenter="onTitleEnter"
          @mouseleave="showTitleTooltip = false"
        >
          {{ to(event.name) }}
          <q-tooltip
            v-model="showTitleTooltip"
            no-parent-event
            anchor="bottom start"
            self="top start"
          >
            {{ to(event.name) }}
          </q-tooltip>
        </div>
        <div class="mgmt-card__timing">
          <span class="mgmt-card__dates">{{ dateRange }}</span>
          <span class="mgmt-card__sep">·</span>
          <span :class="`mgmt-card__rel mgmt-card__rel--${phase}`">
            {{ relLabel }}
          </span>
        </div>
        <div class="mgmt-card__org">
          <q-icon
            name="apartment"
            size="13px"
          />
          <span class="ellipsis">{{ event.organizationName }}</span>
          <q-tooltip
            anchor="bottom start"
            self="top start"
          >
            {{ t('organization', { organization: event.organizationName }) }}
          </q-tooltip>
        </div>
      </div>

      <q-btn
        class="mgmt-card__more"
        icon="more_vert"
        round
        flat
        dense
        :disable="actionLoading"
        :aria-label="t('action.more')"
        @click.stop
        @keyup.enter.stop
      >
        <event-card-menu
          :event
          :share-warning="shareWarning"
          @edit="editAction"
          @delete="deleteAction"
          @share="shareAction"
        />
      </q-btn>
    </div>

    <!-- Operational status -->
    <div class="mgmt-card__metrics">
      <!-- Capacity -->
      <div
        v-if="capacity"
        class="mgmt-card__capacity"
        :class="{ 'mgmt-card__capacity--low': capacity.low }"
      >
        <div class="mgmt-card__capacity-head">
          <span class="mgmt-card__capacity-label">
            {{ t('capacity.label') }}
          </span>
          <span class="mgmt-card__capacity-count">
            <template v-if="capacity.free !== null">
              {{ capacity.used
              }}<span class="mgmt-card__capacity-max">/{{ capacity.max }}</span>
            </template>
            <template v-else>
              {{ t('capacity.max', { count: capacity.max }) }}
            </template>
          </span>
        </div>
        <div
          v-if="capacity.free !== null"
          class="mgmt-card__capacity-track"
        >
          <div
            class="mgmt-card__capacity-fill"
            :style="{ width: `${capacity.percent}%` }"
          />
        </div>
      </div>

      <!-- Registration status -->
      <component
        :is="canEdit ? 'button' : 'div'"
        class="mgmt-card__status"
        :class="[
          `mgmt-card__status--${status.kind}`,
          { 'mgmt-card__status--editable': canEdit },
        ]"
        :type="canEdit ? 'button' : undefined"
        :disabled="canEdit ? registrationLoading : undefined"
        :aria-label="canEdit ? t('registration.manage') : undefined"
        @click="canEdit && manageRegistration()"
      >
        <q-spinner
          v-if="registrationLoading"
          size="14px"
        />
        <q-icon
          v-else
          :name="status.icon"
          size="14px"
        />
        {{ status.label }}
        <q-icon
          v-if="canEdit && !registrationLoading"
          name="edit"
          size="13px"
          class="mgmt-card__status-edit"
        />
        <q-tooltip
          v-if="status.kind === 'blocked'"
          anchor="bottom start"
          self="top start"
        >
          {{
            t(
              event.organizationVerificationStatus === 'REJECTED'
                ? 'status.organizationRejectedHint'
                : 'status.pendingVerificationHint',
              { organization: event.organizationName },
            )
          }}
        </q-tooltip>
      </component>
    </div>

    <!-- Quick navigation -->
    <div
      v-if="quickLinks.length"
      class="mgmt-card__nav"
    >
      <q-btn
        v-for="link in quickLinks"
        :key="link.key"
        class="mgmt-card__nav-btn"
        :icon="link.icon"
        :label="link.label"
        no-caps
        unelevated
        @click="go(link.name)"
      />
    </div>
  </q-card>
</template>

<script lang="ts" setup>
import EventCardMenu from '@/components/eventManagement/index/EventCardMenu.vue';
import { useEventsStore } from '@/stores/events-store';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { copyToClipboard, useQuasar } from 'quasar';
import type { Event } from '@camp-registration/common/entities';
import type { ScopePermission } from '@camp-registration/common/permissions';
import { computed, type Ref, ref } from 'vue';
import { useProfileStore } from '@/stores/profile-store';
import SafeDeleteDialog from '@/components/common/dialogs/SafeDeleteDialog.vue';
import RegistrationScheduleDialog from '@/components/eventManagement/index/RegistrationScheduleDialog.vue';
import type { RegistrationScheduleResult } from '@/components/eventManagement/index/RegistrationScheduleDialog.vue';
import { usePermissions } from '@/composables/permissions';

const capsStore = useEventsStore();
const profileStore = useProfileStore();
const router = useRouter();
const quasar = useQuasar();
const { t, locale } = useI18n();
const { to } = useObjectTranslation();
const { canFor } = usePermissions();

const { event } = defineProps<{
  event: Event;
}>();

const titleRef = ref<HTMLElement>();
const showTitleTooltip = ref<boolean>(false);

function onTitleEnter() {
  const el = titleRef.value;
  // Only show the tooltip when the title is actually clamped/truncated.
  showTitleTooltip.value = !!el && el.scrollHeight > el.clientHeight;
}

const tones = ['primary', 'secondary', 'tertiary'] as const;

const tone = computed<(typeof tones)[number]>(() => {
  const hash = [...event.id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return tones[hash % tones.length] ?? 'primary';
});

const monogram = computed<string>(() => {
  return to(event.name).trim().charAt(0).toUpperCase() || '•';
});

const dateRange = computed<string>(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, {
    day: 'numeric',
    month: 'short',
  });

  try {
    return formatter.formatRange(
      new Date(event.startAt),
      new Date(event.endAt),
    );
  } catch {
    return `${new Date(event.startAt).toLocaleDateString()} – ${new Date(
      event.endAt,
    ).toLocaleDateString()}`;
  }
});

type Phase = 'ongoing' | 'upcoming' | 'past';

const phase = computed<Phase>(() => {
  const now = Date.now();
  const start = new Date(event.startAt).getTime();
  const end = new Date(event.endAt).getTime();
  if (now < start) {
    return 'upcoming';
  }
  if (now > end) {
    return 'past';
  }
  return 'ongoing';
});

function relativeTime(target: Date): string {
  const rtf = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' });
  const days = Math.round((target.getTime() - Date.now()) / 86_400_000);
  const abs = Math.abs(days);
  if (abs >= 60) {
    return rtf.format(Math.round(days / 30), 'month');
  }
  if (abs >= 14) {
    return rtf.format(Math.round(days / 7), 'week');
  }
  return rtf.format(days, 'day');
}

const relLabel = computed<string>(() => {
  if (phase.value === 'ongoing') {
    return t('phase.ongoing');
  }
  const target =
    phase.value === 'upcoming'
      ? new Date(event.startAt)
      : new Date(event.endAt);
  return relativeTime(target);
});

function sumTranslatable(
  value: number | Record<string, number> | null | undefined,
): number | null {
  if (value == null) {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  return Object.values(value).reduce<number>((sum, n) => sum + (n ?? 0), 0);
}

interface Capacity {
  max: number;
  free: number | null;
  used: number | null;
  percent: number;
  low: boolean;
}

const capacity = computed<Capacity | null>(() => {
  const max = sumTranslatable(event.maxParticipants);
  if (max == null || max <= 0) {
    return null;
  }

  const free = sumTranslatable(event.freePlaces);
  if (free == null) {
    return { max, free: null, used: null, percent: 0, low: false };
  }

  const used = Math.max(0, max - free);
  return {
    max,
    free,
    used,
    percent: Math.min(100, Math.max(0, (used / max) * 100)),
    low: free <= 5,
  };
});

// The public event page stays reachable outside the registration window, so the
// link is still worth sending — it just can't be signed up through. While the
// organization is unverified the page 403s for everyone but its managers, which
// is the one case where the link is of no use at all.
const shareWarning = computed<string | null>(() => {
  if (event.organizationVerificationStatus !== 'VERIFIED') {
    return t('share.unverified', { organization: event.organizationName });
  }

  switch (event.registrationStatus) {
    case 'upcoming':
      return t('share.upcoming');
    case 'closed':
      return t('share.closed');
    default:
      return null;
  }
});

function shortDate(value: string): string {
  return new Intl.DateTimeFormat(locale.value, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}

interface Status {
  kind: 'open' | 'closes' | 'opens' | 'closed' | 'blocked';
  icon: string;
  label: string;
}

const status = computed<Status>(() => {
  // Takes precedence over the registration window: while the organization is
  // unverified the event is unlisted and refuses registrations, so showing
  // "registration open" here would be a plain untruth.
  if (event.organizationVerificationStatus === 'PENDING') {
    return {
      kind: 'blocked',
      icon: 'gpp_maybe',
      label: t('status.pendingVerification'),
    };
  }

  if (event.organizationVerificationStatus === 'REJECTED') {
    return {
      kind: 'blocked',
      icon: 'gpp_bad',
      label: t('status.organizationRejected'),
    };
  }

  if (event.registrationStatus === 'open') {
    if (event.registrationClosesAt) {
      return {
        kind: 'closes',
        icon: 'schedule',
        label: t('status.closes', {
          date: shortDate(event.registrationClosesAt),
        }),
      };
    }
    return { kind: 'open', icon: 'check_circle', label: t('status.open') };
  }

  if (event.registrationStatus === 'upcoming' && event.registrationOpensAt) {
    return {
      kind: 'opens',
      icon: 'upcoming',
      label: t('status.opens', { date: shortDate(event.registrationOpensAt) }),
    };
  }

  return { kind: 'closed', icon: 'lock', label: t('status.closed') };
});

interface QuickLink {
  key: string;
  icon: string;
  label: string;
  name: string;
  permission: ScopePermission<'event'>;
}

const quickLinks = computed<QuickLink[]>(() => {
  const links: QuickLink[] = [
    {
      key: 'dashboard',
      icon: 'dashboard',
      label: t('nav.dashboard'),
      name: 'management.event.dashboard',
      permission: 'event.registrations.view',
    },
    {
      key: 'participants',
      icon: 'groups',
      label: t('nav.participants'),
      name: 'management.event.participants',
      permission: 'event.registrations.view',
    },
  ];
  return links.filter((link) => canFor(event.id, link.permission));
});

const canEdit = computed<boolean>(() => canFor(event.id, 'event.edit'));

const registrationLoading = ref<boolean>(false);
const editLoading = ref<boolean>(false);
const deleteLoading = ref<boolean>(false);

const actionLoading = computed<boolean>(() => {
  return registrationLoading.value || deleteLoading.value || editLoading.value;
});

function manageRegistration() {
  quasar
    .dialog({
      component: RegistrationScheduleDialog,
      componentProps: {
        name: to(event.name),
        opensAt: event.registrationOpensAt,
        closesAt: event.registrationClosesAt,
      },
    })
    .onOk((result: RegistrationScheduleResult) => {
      void withLoading(registrationLoading, async () => {
        await capsStore.updateEntry(event.id, {
          registrationOpensAt: result.registrationOpensAt,
          registrationClosesAt: result.registrationClosesAt,
        });
        await profileStore.fetchProfile();
      });
    });
}

function go(name: string) {
  void router.push({ name, params: { eventId: event.id } });
}

function openEvent() {
  void router.push({
    name: 'management.event',
    params: {
      eventId: event.id,
    },
  });
}

function shareAction() {
  const url =
    window.location.origin +
    router.resolve({
      name: 'event',
      params: {
        eventId: event.id,
      },
    }).href;

  copyToClipboard(url)
    .then(() => {
      const warning = shareWarning.value;
      quasar.notify({
        type: warning ? 'warning' : 'positive',
        message: t('notification.share_success'),
        ...(warning ? { caption: warning } : {}),
        icon: warning ? 'warning' : 'assignment_turned_in',
      });
    })
    .catch(() => {
      quasar.notify({
        type: 'negative',
        message: t('notification.share_fail'),
      });
    });
}

function editAction() {
  void withLoading(editLoading, async () => {
    await router.push({
      name: 'management.event.settings',
      params: {
        eventId: event.id,
      },
    });
  });
}

function deleteAction() {
  quasar
    .dialog({
      component: SafeDeleteDialog,
      componentProps: {
        title: t('dialog.delete.title'),
        message: t('dialog.delete.message'),
        label: t('dialog.delete.label'),
        value: to(event.name),
      },
      persistent: true,
    })
    .onOk(() => {
      void withLoading(deleteLoading, async () => {
        await capsStore.deleteEntry(event.id);
      });
    });
}

async function withLoading(flag: Ref<boolean>, fn: () => Promise<void>) {
  flag.value = true;
  try {
    await fn();
  } finally {
    flag.value = false;
  }
}
</script>

<style scoped>
.mgmt-card {
  display: flex;
  flex-direction: column;
  gap: 14px;

  min-width: 0;
  padding: 16px;
  border-radius: 16px;

  background: var(--md3-surface-container-low);
  box-shadow: none;

  transition:
    box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1),
    transform 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.mgmt-card:hover {
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.3),
    0 4px 8px 3px rgba(0, 0, 0, 0.15);
}

/* Header */
.mgmt-card__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;

  margin: -4px -4px 0 0;
  border-radius: 12px;
  cursor: pointer;
}

.mgmt-card__head:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

.mgmt-card__avatar {
  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 44px;
  height: 44px;
  border-radius: 12px;

  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  user-select: none;
}

.mgmt-card--primary .mgmt-card__avatar {
  background: var(--md3-primary-container);
  color: var(--md3-on-primary-container);
}

.mgmt-card--secondary .mgmt-card__avatar {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.mgmt-card--tertiary .mgmt-card__avatar {
  background: var(--md3-tertiary-container);
  color: var(--md3-on-tertiary-container);
}

.mgmt-card__heading {
  flex: 1;
  min-width: 0;
}

.mgmt-card__title {
  color: var(--md3-on-surface);

  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

.mgmt-card__timing {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;

  margin-top: 2px;

  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.mgmt-card__dates {
  color: var(--md3-on-surface-variant);
  font-weight: 600;
}

.mgmt-card__sep {
  color: var(--md3-outline);
}

.mgmt-card__rel {
  font-weight: 600;
  color: var(--md3-on-surface-variant);
}

.mgmt-card__rel--ongoing {
  color: var(--md3-primary);
}

.mgmt-card__org {
  display: flex;
  align-items: center;
  gap: 4px;

  min-width: 0;
  margin-top: 2px;

  color: var(--md3-on-surface-variant);
  font-size: 12px;
}

.mgmt-card__more {
  flex-shrink: 0;
  color: var(--md3-on-surface-variant);
}

/* Metrics */
.mgmt-card__metrics {
  display: flex;
  flex-direction: column;
  gap: 10px;

  /* Pin the lower block (capacity + status + nav) to the bottom so cards
     stay aligned even when the title or timing wraps to two lines */
  margin-top: auto;
}

.mgmt-card__capacity {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mgmt-card__capacity-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.mgmt-card__capacity-label {
  color: var(--md3-on-surface-variant);

  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mgmt-card__capacity-count {
  color: var(--md3-on-surface);

  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.mgmt-card__capacity-max {
  color: var(--md3-on-surface-variant);
  font-weight: 500;
}

.mgmt-card__capacity--low .mgmt-card__capacity-count {
  color: var(--md3-warning);
}

.mgmt-card__capacity-track {
  height: 6px;
  border-radius: 3px;
  overflow: hidden;

  background: var(--md3-surface-container-highest);
}

.mgmt-card__capacity-fill {
  height: 100%;
  border-radius: 3px;

  background: var(--md3-primary);

  transition: width 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.mgmt-card--secondary .mgmt-card__capacity-fill {
  background: var(--md3-secondary);
}

.mgmt-card--tertiary .mgmt-card__capacity-fill {
  background: var(--md3-tertiary);
}

.mgmt-card__capacity--low .mgmt-card__capacity-fill {
  background: var(--md3-warning);
}

/* Registration status chip */
.mgmt-card__status {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: 4px;

  height: 28px;
  margin: 0;
  padding: 0 10px;
  border: none;
  border-radius: 14px;

  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
}

.mgmt-card__status--editable {
  cursor: pointer;
  transition: filter 0.15s ease;
}

.mgmt-card__status--editable:hover {
  filter: brightness(0.95);
}

.mgmt-card__status--editable:focus-visible {
  outline: 2px solid var(--md3-primary);
  outline-offset: 2px;
}

.mgmt-card__status--editable:disabled {
  cursor: default;
  opacity: 0.7;
}

.mgmt-card__status-edit {
  margin-left: 2px;
  opacity: 0.7;
}

.mgmt-card__status--open {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
}

.mgmt-card__status--closes {
  background: var(--md3-warning-container);
  color: var(--md3-on-warning-container);
}

.mgmt-card__status--opens,
.mgmt-card__status--closed {
  background: var(--md3-surface-container-highest);
  color: var(--md3-on-surface-variant);
}

/* Distinct from `closed`: nothing the manager configures will change it until
   the organization is verified. */
.mgmt-card__status--blocked {
  background: var(--md3-error-container);
  color: var(--md3-on-error-container);
}

/* Quick navigation */
.mgmt-card__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  padding-top: 14px;
  border-top: 1px solid var(--md3-outline-variant);
}

.mgmt-card__nav-btn {
  flex: 1 1 auto;

  border-radius: 10px;

  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface);

  font-size: 12px;
  font-weight: 500;
}

.mgmt-card__nav-btn:hover {
  background: var(--md3-surface-container-highest);
}
</style>

<i18n lang="yaml" locale="en">
nav:
  dashboard: 'Dashboard'
  participants: 'Participants'
capacity:
  label: 'Participants'
  max: 'Max {count}'
registration:
  manage: 'Manage registration'
phase:
  ongoing: 'Ongoing'
organization: 'Owned by {organization}'
action:
  more: 'More actions'
status:
  open: 'Registration open'
  closes: 'Closes {date}'
  opens: 'Opens {date}'
  closed: 'Registration closed'
  pendingVerification: 'Pending verification'
  organizationRejected: 'Organization rejected'
  pendingVerificationHint: '{organization} is still awaiting verification, so this event is hidden from the public listing and refuses registrations — whatever its registration window says.'
  organizationRejectedHint: '{organization} was not verified, so this event is hidden from the public listing and refuses registrations. Correct its details and submit it for verification again.'
share:
  closed: 'Registration is closed — visitors can view the event but cannot sign up.'
  upcoming: 'Registration has not opened yet — visitors can view the event but cannot sign up yet.'
  unverified: 'Only this event’s managers can open the link while {organization} is unverified.'
dialog:
  delete:
    title: 'Delete event'
    message: 'Are you sure you want to delete this event? All registrations will be lost. This event cannot be used as a template for future events.'
    label: 'Event name'
notification:
  share_success: 'Link copied to clipboard'
  share_fail: 'Failed to copy link to clipboard'
</i18n>

<i18n lang="yaml" locale="de">
nav:
  dashboard: 'Dashboard'
  participants: 'Teilnehmende'
capacity:
  label: 'Teilnehmende'
  max: 'Max. {count}'
registration:
  manage: 'Anmeldung verwalten'
phase:
  ongoing: 'Laufend'
organization: 'Gehört zu {organization}'
action:
  more: 'Weitere Aktionen'
status:
  open: 'Anmeldung offen'
  closes: 'Schließt {date}'
  opens: 'Öffnet {date}'
  closed: 'Anmeldung geschlossen'
  pendingVerification: 'Verifizierung ausstehend'
  organizationRejected: 'Organisation abgelehnt'
  pendingVerificationHint: '{organization} wartet noch auf die Verifizierung. Diese Veranstaltung ist daher nicht öffentlich sichtbar und lehnt Anmeldungen ab — unabhängig vom Anmeldezeitraum.'
  organizationRejectedHint: '{organization} wurde nicht verifiziert. Diese Veranstaltung ist daher nicht öffentlich sichtbar und lehnt Anmeldungen ab. Korrigiere die Angaben und reiche sie erneut zur Verifizierung ein.'
share:
  closed: 'Die Anmeldung ist geschlossen — Besucher sehen die Veranstaltung, können sich aber nicht anmelden.'
  upcoming: 'Die Anmeldung ist noch nicht geöffnet — Besucher sehen die Veranstaltung, können sich aber noch nicht anmelden.'
  unverified: 'Solange {organization} nicht verifiziert ist, können nur die Verantwortlichen dieser Veranstaltung den Link öffnen.'
dialog:
  delete:
    title: 'Veranstaltung löschen'
    message: 'Sind Sie sicher, dass Sie diese Veranstaltung löschen möchten? Alle Anmeldungen gehen verloren. Diese Veranstaltung kann nicht als Vorlage für zukünftige Veranstaltungen verwendet werden.'
    label: 'Veranstaltungsname'
notification:
  share_success: 'Link in die Zwischenablage kopiert'
  share_fail: 'Fehler beim Kopieren des Links in die Zwischenablage'
</i18n>

<i18n lang="yaml" locale="fr">
nav:
  dashboard: 'Tableau de bord'
  participants: 'Participants'
capacity:
  label: 'Participants'
  max: 'Max {count}'
registration:
  manage: "Gérer l'inscription"
phase:
  ongoing: 'En cours'
organization: 'Appartient à {organization}'
action:
  more: "Plus d'actions"
status:
  open: 'Inscription ouverte'
  closes: 'Ferme le {date}'
  opens: 'Ouvre le {date}'
  closed: 'Inscription fermée'
  pendingVerification: 'Vérification en attente'
  organizationRejected: 'Organisation refusée'
  pendingVerificationHint: "{organization} attend encore sa vérification : cet événement est masqué de la liste publique et refuse les inscriptions, quelle que soit sa période d'inscription."
  organizationRejectedHint: "{organization} n'a pas été vérifiée : cet événement est masqué de la liste publique et refuse les inscriptions. Corrige ses informations et soumets-la à nouveau."
share:
  closed: "Les inscriptions sont fermées — les visiteurs peuvent voir l'événement mais pas s’inscrire."

  upcoming: "Les inscriptions ne sont pas encore ouvertes — les visiteurs peuvent voir l'événement mais pas encore s’inscrire."

  unverified: 'Tant que {organization} n’est pas vérifiée, seuls les responsables de cet événement peuvent ouvrir le lien.'
dialog:
  delete:
    title: "Supprimer l'événement"

    message: 'Êtes-vous sûr de vouloir supprimer cet événement ? Toutes les inscriptions seront perdues. Cet événement ne peut pas être utilisé comme modèle pour les événements futurs.'
    label: "Nom de l'événement"

notification:
  share_success: 'Lien copié dans le presse-papiers'
  share_fail: 'Échec de la copie du lien dans le presse-papiers'
</i18n>

<i18n lang="yaml" locale="pl">
nav:
  dashboard: 'Panel'
  participants: 'Uczestnicy'
capacity:
  label: 'Uczestnicy'
  max: 'Maks. {count}'
registration:
  manage: 'Zarządzaj rejestracją'
phase:
  ongoing: 'W trakcie'
organization: 'Należy do {organization}'
action:
  more: 'Więcej akcji'
status:
  open: 'Rejestracja otwarta'
  closes: 'Zamyka się {date}'
  opens: 'Otwiera się {date}'
  closed: 'Rejestracja zamknięta'
  pendingVerification: 'Oczekuje na weryfikację'
  organizationRejected: 'Organizacja odrzucona'
  pendingVerificationHint: '{organization} wciąż oczekuje na weryfikację, więc to wydarzenie jest ukryte na liście publicznej i odrzuca zapisy — niezależnie od okresu rejestracji.'
  organizationRejectedHint: '{organization} nie została zweryfikowana, więc to wydarzenie jest ukryte na liście publicznej i odrzuca zapisy. Popraw dane i zgłoś ją ponownie do weryfikacji.'
share:
  closed: 'Rejestracja jest zamknięta — odwiedzający zobaczą wydarzenie, ale nie mogą się zapisać.'
  upcoming: 'Rejestracja jeszcze się nie rozpoczęła — odwiedzający zobaczą wydarzenie, ale nie mogą się jeszcze zapisać.'
  unverified: 'Dopóki {organization} nie zostanie zweryfikowana, link mogą otworzyć tylko osoby zarządzające tym wydarzeniem.'
dialog:
  delete:
    title: 'Usuń wydarzenie'
    message: 'Czy na pewno chcesz usunąć to wydarzenie? Wszystkie zgłoszenia zostaną utracone. To wydarzenie nie będzie mogło być użyte jako szablon dla przyszłych wydarzeń.'
    label: 'Nazwa wydarzenia'
notification:
  share_success: 'Link skopiowany do schowka'
  share_fail: 'Błąd podczas kopiowania linku do schowka'
</i18n>

<i18n lang="yaml" locale="cs">
nav:
  dashboard: 'Přehled'
  participants: 'Účastníci'
capacity:
  label: 'Účastníci'
  max: 'Max {count}'
registration:
  manage: 'Spravovat registraci'
phase:
  ongoing: 'Probíhá'
organization: 'Patří organizaci {organization}'
action:
  more: 'Další akce'
status:
  open: 'Registrace otevřena'
  closes: 'Uzavírá se {date}'
  opens: 'Otevírá se {date}'
  closed: 'Registrace uzavřena'
  pendingVerification: 'Čeká na ověření'
  organizationRejected: 'Organizace zamítnuta'
  pendingVerificationHint: '{organization} stále čeká na ověření, takže tato akce je skrytá ve veřejném seznamu a odmítá registrace — bez ohledu na registrační období.'
  organizationRejectedHint: '{organization} nebyla ověřena, takže tato akce je skrytá ve veřejném seznamu a odmítá registrace. Uprav její údaje a odešli ji znovu k ověření.'
share:
  closed: 'Registrace je uzavřena — návštěvníci akci uvidí, ale nemohou se přihlásit.'
  upcoming: 'Registrace ještě nezačala — návštěvníci akci uvidí, ale zatím se nemohou přihlásit.'
  unverified: 'Dokud není {organization} ověřena, může odkaz otevřít pouze správa této akce.'
dialog:
  delete:
    title: 'Smazat akci'
    message: 'Opravdu chcete tuto akci smazat? Všechny registrace budou ztraceny. Tuto akci nebude možné použít jako šablonu pro budoucí akce.'
    label: 'Název akce'
notification:
  share_success: 'Odkaz zkopírován do schránky'
  share_fail: 'Chyba při kopírování odkazu do schránky'
</i18n>
