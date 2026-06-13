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
      :aria-label="to(camp.name)"
      @click="openCamp"
      @keyup.enter="openCamp"
    >
      <span
        class="mgmt-card__avatar"
        aria-hidden="true"
      >
        {{ monogram }}
      </span>

      <div class="mgmt-card__heading">
        <div class="mgmt-card__title ellipsis-2-lines">
          {{ to(camp.name) }}
        </div>
        <div class="mgmt-card__timing">
          <span class="mgmt-card__dates">{{ dateRange }}</span>
          <span class="mgmt-card__sep">·</span>
          <span :class="`mgmt-card__rel mgmt-card__rel--${phase}`">
            {{ relLabel }}
          </span>
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
        <results-item-menu
          :camp
          :active="registrationOpen"
          @edit="editAction"
          @delete="deleteAction"
          @share="shareAction"
          @results="openCamp"
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
import ResultsItemMenu from 'components/campManagement/index/ResultsItemMenu.vue';
import { useCampsStore } from 'stores/camps-store';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { copyToClipboard, useQuasar } from 'quasar';
import type { Camp } from '@camp-registration/common/entities';
import type { Permission } from '@camp-registration/common/permissions';
import { computed, type Ref, ref } from 'vue';
import { useProfileStore } from 'stores/profile-store';
import SafeDeleteDialog from 'components/common/dialogs/SafeDeleteDialog.vue';
import RegistrationDialog from 'components/campManagement/index/RegistrationDialog.vue';
import type { RegistrationResult } from 'components/campManagement/index/RegistrationDialog.vue';
import { usePermissions } from 'src/composables/permissions';

const capsStore = useCampsStore();
const profileStore = useProfileStore();
const router = useRouter();
const quasar = useQuasar();
const { t, locale } = useI18n();
const { to } = useObjectTranslation();
const { canFor } = usePermissions();

const { camp } = defineProps<{
  camp: Camp;
}>();

const tones = ['primary', 'secondary', 'tertiary'] as const;

const tone = computed<(typeof tones)[number]>(() => {
  const hash = [...camp.id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return tones[hash % tones.length] ?? 'primary';
});

const monogram = computed<string>(() => {
  return to(camp.name).trim().charAt(0).toUpperCase() || '•';
});

const dateRange = computed<string>(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, {
    day: 'numeric',
    month: 'short',
  });

  try {
    return formatter.formatRange(new Date(camp.startAt), new Date(camp.endAt));
  } catch {
    return `${new Date(camp.startAt).toLocaleDateString()} – ${new Date(
      camp.endAt,
    ).toLocaleDateString()}`;
  }
});

type Phase = 'ongoing' | 'upcoming' | 'past';

const phase = computed<Phase>(() => {
  const now = Date.now();
  const start = new Date(camp.startAt).getTime();
  const end = new Date(camp.endAt).getTime();
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
    phase.value === 'upcoming' ? new Date(camp.startAt) : new Date(camp.endAt);
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
  const max = sumTranslatable(camp.maxParticipants);
  if (max == null || max <= 0) {
    return null;
  }

  const free = sumTranslatable(camp.freePlaces);
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

const registrationOpen = computed<boolean>(() => {
  if (!camp.registrationOpensAt && !camp.registrationClosesAt) {
    return false;
  }
  const now = new Date();
  return (
    (!camp.registrationOpensAt || now >= new Date(camp.registrationOpensAt)) &&
    (!camp.registrationClosesAt || now <= new Date(camp.registrationClosesAt))
  );
});

function shortDate(value: string): string {
  return new Intl.DateTimeFormat(locale.value, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}

interface Status {
  kind: 'open' | 'closes' | 'opens' | 'closed';
  icon: string;
  label: string;
}

const status = computed<Status>(() => {
  if (registrationOpen.value) {
    if (camp.registrationClosesAt) {
      return {
        kind: 'closes',
        icon: 'schedule',
        label: t('status.closes', {
          date: shortDate(camp.registrationClosesAt),
        }),
      };
    }
    return { kind: 'open', icon: 'check_circle', label: t('status.open') };
  }

  if (
    camp.registrationOpensAt &&
    new Date(camp.registrationOpensAt) > new Date()
  ) {
    return {
      kind: 'opens',
      icon: 'upcoming',
      label: t('status.opens', { date: shortDate(camp.registrationOpensAt) }),
    };
  }

  return { kind: 'closed', icon: 'lock', label: t('status.closed') };
});

interface QuickLink {
  key: string;
  icon: string;
  label: string;
  name: string;
  permission: Permission;
}

const quickLinks = computed<QuickLink[]>(() => {
  const links: QuickLink[] = [
    {
      key: 'dashboard',
      icon: 'dashboard',
      label: t('nav.dashboard'),
      name: 'management.camp.dashboard',
      permission: 'camp.registrations.view',
    },
    {
      key: 'participants',
      icon: 'groups',
      label: t('nav.participants'),
      name: 'management.camp.participants',
      permission: 'camp.registrations.view',
    },
  ];
  return links.filter((link) => canFor(camp.id, link.permission));
});

const canEdit = computed<boolean>(() => canFor(camp.id, 'camp.edit'));

const registrationLoading = ref<boolean>(false);
const editLoading = ref<boolean>(false);
const deleteLoading = ref<boolean>(false);

const actionLoading = computed<boolean>(() => {
  return registrationLoading.value || deleteLoading.value || editLoading.value;
});

function manageRegistration() {
  quasar
    .dialog({
      component: RegistrationDialog,
      componentProps: {
        name: to(camp.name),
        opensAt: camp.registrationOpensAt,
        closesAt: camp.registrationClosesAt,
      },
    })
    .onOk((result: RegistrationResult) => {
      void withLoading(registrationLoading, async () => {
        await capsStore.updateEntry(camp.id, {
          registrationOpensAt: result.registrationOpensAt,
          registrationClosesAt: result.registrationClosesAt,
        });
        await profileStore.fetchProfile();
      });
    });
}

function go(name: string) {
  void router.push({ name, params: { campId: camp.id } });
}

function openCamp() {
  void router.push({
    name: 'management.camp',
    params: {
      campId: camp.id,
    },
  });
}

function shareAction() {
  const url =
    window.location.origin +
    router.resolve({
      name: 'camp',
      params: {
        campId: camp.id,
      },
    }).href;

  copyToClipboard(url)
    .then(() => {
      quasar.notify({
        type: 'positive',
        message: t('notification.share_success'),
        icon: 'assignment_turned_in',
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
      name: 'management.camp.settings.edit',
      params: {
        campId: camp.id,
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
        value: to(camp.name),
      },
      persistent: true,
    })
    .onOk(() => {
      void withLoading(deleteLoading, async () => {
        await capsStore.deleteEntry(camp.id);
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
action:
  more: 'More actions'
status:
  open: 'Registration open'
  closes: 'Closes {date}'
  opens: 'Opens {date}'
  closed: 'Registration closed'
dialog:
  delete:
    title: 'Delete camp'
    message: 'Are you sure you want to delete this camp? All registrations will be lost. This camp cannot be used as a template for future camps.'
    label: 'Camp name'
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
action:
  more: 'Weitere Aktionen'
status:
  open: 'Anmeldung offen'
  closes: 'Schließt {date}'
  opens: 'Öffnet {date}'
  closed: 'Anmeldung geschlossen'
dialog:
  delete:
    title: 'Camp löschen'
    message: 'Sind Sie sicher, dass Sie dieses Camp löschen möchten? Alle Anmeldungen gehen verloren. Dieses Camp kann nicht als Vorlage für zukünftige Lager verwendet werden.'
    label: 'Camp Name'
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
action:
  more: "Plus d'actions"
status:
  open: 'Inscription ouverte'
  closes: 'Ferme le {date}'
  opens: 'Ouvre le {date}'
  closed: 'Inscription fermée'
dialog:
  delete:
    title: 'Supprimer le camp'
    message: 'Êtes-vous sûr de vouloir supprimer ce camp ? Toutes les inscriptions seront perdues. Ce camp ne peut pas être utilisé comme modèle pour les camps futurs.'
    label: 'Nom du camp'
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
action:
  more: 'Więcej akcji'
status:
  open: 'Rejestracja otwarta'
  closes: 'Zamyka się {date}'
  opens: 'Otwiera się {date}'
  closed: 'Rejestracja zamknięta'
dialog:
  delete:
    title: 'Usuń obóz'
    message: 'Czy na pewno chcesz usunąć ten obóz? Wszystkie zgłoszenia zostaną utracone. Ten obóz nie będzie mógł być użyty jako szablon dla przyszłych obozów.'
    label: 'Nazwa obozu'
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
action:
  more: 'Další akce'
status:
  open: 'Registrace otevřena'
  closes: 'Uzavírá se {date}'
  opens: 'Otevírá se {date}'
  closed: 'Registrace uzavřena'
dialog:
  delete:
    title: 'Smazat tábor'
    message: 'Opravdu chcete tento tábor smazat? Všechny registrace budou ztraceny. Tento tábor nebude možné použít jako šablonu pro budoucí tábory.'
    label: 'Název tábora'
notification:
  share_success: 'Odkaz zkopírován do schránky'
  share_fail: 'Chyba při kopírování odkazu do schránky'
</i18n>
