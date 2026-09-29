<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <chore-dialog-card
      ref="card"
      :title="t('title')"
      :subtitle="t('subtitle')"
      :width="600"
      @cancel="onDialogCancel"
    >
      <template
        v-if="can('event.chore_assignments.edit')"
        #actions
      >
        <q-btn
          outline
          rounded
          color="primary"
          icon="swap_horiz"
          no-caps
          :label="t('action.rebalance')"
          @click="rebalance"
        />
        <q-btn
          rounded
          color="primary"
          :label="t('action.close')"
          @click="onDialogCancel"
        />
      </template>
      <template #pinned>
        <div class="filters row items-center">
          <q-btn-toggle
            v-model="group"
            class="compact-toggle"
            no-caps
            rounded
            unelevated
            dense
            toggle-color="primary"
            :options="[
              { value: 'participants', label: t('group.participants') },
              { value: 'staff', label: t('group.staff') },
            ]"
          />
          <q-chip
            clickable
            class="filter-chip"
            :class="{ 'filter-chip--active': onlyUnassigned }"
            :icon="onlyUnassigned ? 'check' : undefined"
            @click="onlyUnassigned = !onlyUnassigned"
          >
            {{ t('filter.unassigned', { count: unassignedCount }) }}
          </q-chip>
        </div>
      </template>

      <div class="column no-wrap q-gutter-y-md">
        <div
          v-if="loading"
          class="column no-wrap q-gutter-y-sm"
        >
          <q-skeleton
            v-for="index in 5"
            :key="index"
            type="rect"
            height="44px"
            class="rounded-md"
          />
        </div>

        <div
          v-else-if="rows.length === 0"
          class="text-body2 text-grey-6 q-py-md text-center"
        >
          {{ t('empty') }}
        </div>

        <q-list
          v-else
          separator
          bordered
          class="rounded-lg"
        >
          <q-item
            v-for="row in rows"
            :key="row.registrationId"
          >
            <q-item-section>
              <q-item-label>{{ row.name }}</q-item-label>
              <!-- The balance leads the caption rather than sitting beside the
                   bar, so the bar keeps the full width on a phone. "About
                   average" is left to the bar and its average line. -->
              <q-item-label
                v-if="showBalance(row) || rowParts(row).length > 0"
                caption
                class="row-parts"
              >
                <span
                  v-if="showBalance(row)"
                  class="balance-text"
                  :class="`balance-text--${row.balance}`"
                >
                  {{ t(`balance.${row.balance}`) }}
                </span>
                <span
                  v-for="part in rowParts(row)"
                  :key="part"
                >
                  {{ part }}
                </span>
              </q-item-label>
              <!-- Bar: share of the busiest person's load, solid where done;
                   line: the average. -->
              <div
                v-if="row.load > 0"
                class="q-mt-xs"
              >
                <div class="balance-bar rounded-full">
                  <div
                    class="balance-fill rounded-full"
                    :class="`balance-fill--${row.balance}`"
                    :style="{ width: percent(row.load) }"
                  >
                    <div
                      class="balance-done"
                      :style="{ width: `${(row.doneLoad / row.load) * 100}%` }"
                    />
                  </div>
                  <div
                    class="balance-average"
                    :style="{ left: percent(groupAverage) }"
                  />
                </div>
              </div>
              <div
                v-else
                class="text-caption text-grey-7 q-mt-xs"
              >
                {{ t('noDuty') }}
              </div>
            </q-item-section>
            <q-item-section
              v-if="can('event.chore_assignments.edit')"
              side
            >
              <q-btn
                icon="more_vert"
                flat
                round
                :aria-label="t('action.more')"
              >
                <q-menu>
                  <q-list>
                    <q-item
                      v-close-popup
                      clickable
                      @click="removePerson(row.registrationId)"
                    >
                      <q-item-section avatar>
                        <q-icon name="person_remove" />
                      </q-item-section>
                      <q-item-section>{{ t('action.remove') }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </chore-dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref, useTemplateRef, watch } from 'vue';
import type {
  ChoreFairnessEntry,
  ChoreRebalanceChange,
  ChoreMemberRemovalQuery,
  Registration,
} from '@camp-registration/common/entities';
import { useChoreAssignmentStore } from '@/stores/chore-assignment-store';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { usePermissions } from '@/composables/permissions';
import { formatPersonName } from '@/utils/formatters';
import ChoreDialogCard from '@/components/event/chorePlanner/ChoreDialogCard.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import ChoreRemovePersonDialog from '@/components/event/chorePlanner/dialogs/ChoreRemovePersonDialog.vue';
import ChoreRebalanceDialog from '@/components/event/chorePlanner/dialogs/ChoreRebalanceDialog.vue';
import { useChoreStore } from '@/stores/chore-store';

const { t } = useI18n();
const quasar = useQuasar();
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();
const choreAssignmentStore = useChoreAssignmentStore();
const choreStore = useChoreStore();
const registrationHelper = useRegistrationHelper();
const { can } = usePermissions();

const props = defineProps<{
  registrations: Registration[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

function showBalance(row: Row): boolean {
  return row.load > 0 && row.balance !== 'AVERAGE';
}

interface Row extends ChoreFairnessEntry {
  name: string;
  staff: boolean;
}

const entries = ref<ChoreFairnessEntry[]>([]);
const loading = ref<boolean>(true);
const group = ref<'participants' | 'staff'>('participants');
const onlyUnassigned = ref<boolean>(false);
const card = useTemplateRef<{ scrollToTop: () => void }>('card');

// Another group or filter is another list; start it from the top.
watch([group, onlyUnassigned], () => card.value?.scrollToTop());

async function load() {
  loading.value = true;
  try {
    entries.value = await choreAssignmentStore.fetchFairness();
  } finally {
    loading.value = false;
  }
}
void load();

const groupRows = computed<Row[]>(() => {
  const byId = new Map(props.registrations.map((r) => [r.id, r]));
  return entries.value
    .flatMap((entry) => {
      const registration = byId.get(entry.registrationId);
      return registration
        ? [
            {
              ...entry,
              name: formatPersonName(
                registrationHelper.uniqueName(registration),
              ),
              staff: !registrationHelper.participant(registration),
            },
          ]
        : [];
    })
    .filter((row) => row.staff === (group.value === 'staff'));
});

const groupMax = computed<number>(() =>
  Math.max(0, ...groupRows.value.map((row) => row.load)),
);

const groupAverage = computed<number>(() =>
  groupRows.value.length === 0
    ? 0
    : groupRows.value.reduce((sum, row) => sum + row.load, 0) /
      groupRows.value.length,
);

function percent(load: number): string {
  return `${groupMax.value > 0 ? (load / groupMax.value) * 100 : 0}%`;
}

const isUnassigned = (row: Row) =>
  row.dutyCount === 0 && row.supervisionCount === 0;

const unassignedCount = computed<number>(
  () => groupRows.value.filter(isUnassigned).length,
);

// Most loaded first, so imbalances are what you see.
const rows = computed<Row[]>(() =>
  groupRows.value
    .filter((row) => !onlyUnassigned.value || isUnassigned(row))
    .sort((a, b) => b.share - a.share || a.name.localeCompare(b.name)),
);

function rowParts(row: Row): string[] {
  return [
    // "No duty yet" below already says it for someone without any.
    row.doneDutyCount > 0 ? t('summary.done', row.doneDutyCount) : undefined,
    row.dutyCount > row.doneDutyCount
      ? t('summary.upcoming', row.dutyCount - row.doneDutyCount)
      : undefined,
    row.heavyCount > 0 ? t('summary.heavy', row.heavyCount) : undefined,
    row.supervisionCount > 0
      ? t('summary.supervisions', row.supervisionCount)
      : undefined,
    row.missedCount > 0 ? t('summary.missed', row.missedCount) : undefined,
  ].filter((part): part is string => !!part);
}

function rebalance() {
  quasar
    .dialog({
      component: ChoreRebalanceDialog,
      componentProps: {
        chores: choreStore.data ?? [],
        registrations: props.registrations,
      },
    })
    .onOk((changes: ChoreRebalanceChange[]) => {
      void choreAssignmentStore.applyRebalance(changes).then(load);
    });
}

function removePerson(registrationId: string) {
  quasar
    .dialog({
      component: ChoreRemovePersonDialog,
      componentProps: { registrations: props.registrations, registrationId },
    })
    .onOk(
      (removal: { registrationId: string; query: ChoreMemberRemovalQuery }) => {
        void choreAssignmentStore
          .removeMember(removal.registrationId, removal.query)
          .then(load);
      },
    );
}
</script>

<style scoped>
.filter-chip {
  margin: 0;
  border: 1px solid var(--md3-outline-variant);
  border-radius: 8px;
  background: transparent;
  color: var(--md3-on-surface-variant);
}

.filter-chip--active {
  border-color: transparent;
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.filters {
  gap: 8px;
}

/* Wraps between parts, never inside one ("1 duty done" stays together). */
.row-parts {
  display: flex;
  flex-wrap: wrap;
  column-gap: 4px;
}

.row-parts > span {
  white-space: nowrap;
}

.row-parts > span:not(:last-child)::after {
  content: '·';
  margin-left: 4px;
}

.balance-text {
  font-weight: 500;
}

.balance-text--BELOW {
  color: var(--md3-tertiary);
}

.balance-text--ABOVE {
  color: var(--md3-error);
}

.balance-bar {
  position: relative;
  height: 8px;
  background: var(--md3-surface-container-highest);
}

.balance-fill {
  height: 100%;
  overflow: hidden;
  background: color-mix(in srgb, currentColor 35%, transparent);
}

.balance-done {
  height: 100%;
  background: currentColor;
}

.balance-average {
  position: absolute;
  top: -3px;
  width: 2px;
  height: 14px;
  margin-left: -1px;
  border-radius: 1px;
  background: var(--md3-on-surface);
}

/* Solid: done; tint: still planned. */
.balance-fill--BELOW {
  color: var(--md3-tertiary);
}

.balance-fill--AVERAGE {
  color: var(--md3-primary);
}

.balance-fill--ABOVE {
  color: var(--md3-error);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Fairness'
subtitle: 'Heavy duties count more, light ones less. Cancelled and missed duties do not count. Solid is done, light is still planned. The line marks the average.'
noDuty: 'No duty yet'
empty: 'No one here yet.'
group:
  participants: 'Participants'
  staff: 'Staff'
filter:
  unassigned: 'No duty yet ({count})'
balance:
  BELOW: 'Less than average'
  ABOVE: 'More than average'
summary:
  done: 'No duties done | 1 duty done | {n} duties done'
  upcoming: '{n} upcoming'
  heavy: '{n} heavy'
  supervisions: '{n} supervision | {n} supervisions'
  missed: '{n} missed'
action:
  more: 'More'
  remove: 'Remove from duties…'
  rebalance: 'Rebalance…'
  close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Fairness'
subtitle: 'Schwere Dienste zählen mehr, leichte weniger. Abgesagte und verpasste Dienste zählen nicht. Kräftig ist erledigt, hell noch geplant. Der Strich markiert den Durchschnitt.'
noDuty: 'Noch kein Dienst'
empty: 'Hier ist noch niemand.'
group:
  participants: 'Teilnehmende'
  staff: 'Betreuende'
filter:
  unassigned: 'Noch kein Dienst ({count})'
balance:
  BELOW: 'Weniger als der Durchschnitt'
  ABOVE: 'Mehr als der Durchschnitt'
summary:
  done: 'Keine Dienste erledigt | 1 Dienst erledigt | {n} Dienste erledigt'
  upcoming: '{n} geplant'
  heavy: '{n} schwer'
  supervisions: '{n} Aufsicht | {n} Aufsichten'
  missed: '{n} verpasst'
action:
  more: 'Mehr'
  remove: 'Aus Diensten nehmen…'
  rebalance: 'Ausgleichen…'
  close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Équité'
subtitle: 'Les corvées lourdes comptent plus, les légères moins. Les corvées annulées ou manquées ne comptent pas. Plein : fait, clair : encore prévu. Le trait indique la moyenne.'
noDuty: 'Aucune corvée pour l’instant'
empty: 'Personne pour le moment.'
group:
  participants: 'Participants'
  staff: 'Encadrement'
filter:
  unassigned: 'Aucune corvée ({count})'
balance:
  BELOW: 'Moins que la moyenne'
  ABOVE: 'Plus que la moyenne'
summary:
  done: 'Aucune corvée faite | 1 corvée faite | {n} corvées faites'
  upcoming: '{n} à venir'
  heavy: '{n} lourde(s)'
  supervisions: '{n} encadrement | {n} encadrements'
  missed: '{n} manquée(s)'
action:
  more: 'Plus'
  remove: 'Retirer des corvées…'
  rebalance: 'Rééquilibrer…'
  close: 'Fermer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Sprawiedliwość'
subtitle: 'Ciężkie dyżury liczą się bardziej, lekkie mniej. Odwołane i pominięte dyżury się nie liczą. Pełny kolor: wykonane, jasny: zaplanowane. Kreska oznacza średnią.'
noDuty: 'Jeszcze bez dyżuru'
empty: 'Nikogo tu jeszcze nie ma.'
group:
  participants: 'Uczestnicy'
  staff: 'Kadra'
filter:
  unassigned: 'Bez dyżuru ({count})'
balance:
  BELOW: 'Mniej niż średnio'
  ABOVE: 'Więcej niż średnio'
summary:
  done: 'Brak wykonanych dyżurów | 1 dyżur wykonany | {n} dyżurów wykonanych'
  upcoming: '{n} zaplanowanych'
  heavy: '{n} ciężkich'
  supervisions: '{n} opieka | {n} opiek'
  missed: '{n} pominiętych'
action:
  more: 'Więcej'
  remove: 'Usuń z dyżurów…'
  rebalance: 'Wyrównaj…'
  close: 'Zamknij'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Spravedlnost'
subtitle: 'Těžké služby se počítají více, lehké méně. Zrušené a zmeškané služby se nepočítají. Plná barva: hotovo, světlá: ještě naplánováno. Čára označuje průměr.'
noDuty: 'Zatím bez služby'
empty: 'Zatím tu nikdo není.'
group:
  participants: 'Účastníci'
  staff: 'Vedoucí'
filter:
  unassigned: 'Zatím bez služby ({count})'
balance:
  BELOW: 'Méně než průměr'
  ABOVE: 'Více než průměr'
summary:
  done: 'Žádné služby hotové | 1 služba hotová | {n} služeb hotových'
  upcoming: '{n} naplánovaných'
  heavy: '{n} těžkých'
  supervisions: '{n} dozor | {n} dozorů'
  missed: '{n} zmeškaných'
action:
  more: 'Více'
  remove: 'Odebrat ze služeb…'
  rebalance: 'Vyrovnat…'
  close: 'Zavřít'
</i18n>
