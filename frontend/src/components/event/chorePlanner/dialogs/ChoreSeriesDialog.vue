<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <chore-dialog-card
      :title="t('title')"
      :subtitle="t(`description.${scope}`)"
      :width="560"
      @submit="onOKClick"
      @cancel="onDialogCancel"
    >
      <div class="q-gutter-y-md column no-wrap">
        <div>
          <q-btn-toggle
            v-model="scope"
            class="full-width compact-toggle"
            spread
            no-caps
            rounded
            unelevated
            dense
            toggle-color="primary"
            :options="[
              { label: t('field.scope.option.NEW'), value: 'NEW' },
              { label: t('field.scope.option.EXISTING'), value: 'EXISTING' },
            ]"
          />
        </div>

        <div class="row q-gutter-x-xs no-wrap">
          <q-select
            v-model="choreId"
            class="col"
            :label="t('field.chore')"
            :options="choreOptions"
            :rules="[(val) => !!val || t('rule.chore')]"
            map-options
            emit-value
            hide-bottom-space
            outlined
            rounded
            @update:model-value="onChoreChange"
          >
            <template #prepend>
              <q-icon name="checklist" />
            </template>
          </q-select>
          <q-btn
            v-if="can('event.chores.create')"
            round
            outline
            color="primary"
            icon="add"
            class="col-shrink self-center"
            :aria-label="t('action.addChore')"
            @click="addChore"
          >
            <q-tooltip>{{ t('action.addChore') }}</q-tooltip>
          </q-btn>
        </div>

        <div v-if="chore && chore.slots.length > 0">
          <div class="text-caption text-grey-7 q-mb-xs">
            {{ t('field.slots') }}
          </div>
          <div class="chip-row row">
            <q-chip
              v-for="slot in chore.slots"
              :key="slot.id"
              clickable
              class="filter-chip"
              :class="{ 'filter-chip--active': slotIds.includes(slot.id) }"
              @click="toggleSlot(slot.id)"
            >
              {{ to(slot.name) }}
            </q-chip>
          </div>
        </div>

        <date-range-input
          v-model:from="from"
          v-model:to="until"
          date-only
          :event-days="eventDays"
          :label="t('field.range')"
        >
          <template #prepend>
            <q-icon name="date_range" />
          </template>
        </date-range-input>

        <div v-if="scope === 'EXISTING'">
          <div class="text-caption text-grey-7 q-mb-xs">
            {{ t('field.existingAction.label') }}
          </div>
          <q-option-group
            v-model="existingAction"
            :options="existingOptions"
          >
            <template #label="option">
              <div>{{ option.label }}</div>
              <div class="text-caption text-grey-7">{{ option.caption }}</div>
            </template>
          </q-option-group>
        </div>

        <!-- Filling keeps each duty's own unit. -->
        <div
          v-if="
            hasRooms &&
            chore?.eligibility !== 'STAFF' &&
            (scope === 'NEW' || existingAction === 'REPLACE')
          "
        >
          <div class="text-caption text-grey-7 q-mb-xs">
            {{ t('field.rotationUnit.label') }}
          </div>
          <q-btn-toggle
            v-model="rotationUnit"
            class="full-width compact-toggle"
            spread
            no-caps
            rounded
            unelevated
            dense
            toggle-color="primary"
            :options="[
              {
                label: t('field.rotationUnit.option.PERSON'),
                value: 'PERSON',
              },
              {
                label: t('field.rotationUnit.option.ROOM'),
                value: 'ROOM',
              },
            ]"
          />
        </div>

        <q-item
          v-if="scope === 'NEW'"
          tag="label"
          class="q-px-none"
        >
          <q-item-section>
            <q-item-label>{{ t('field.assign.label') }}</q-item-label>
            <q-item-label
              v-if="!assign"
              caption
            >
              {{ t('field.assign.off') }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle v-model="assign" />
          </q-item-section>
        </q-item>

        <div
          v-if="replaced.length > 0"
          class="replace-warning row items-center no-wrap"
        >
          <q-icon
            name="warning_amber"
            size="18px"
          />
          <span class="text-caption">
            {{ t('replaceWarning', replaced.length) }}
          </span>
        </div>

        <q-banner
          v-if="occurrences.length > 0"
          dense
          class="rounded-lg summary"
        >
          <template #avatar>
            <q-icon name="auto_awesome" />
          </template>
          {{ summary }}
          <div
            v-if="untouched"
            class="text-caption q-mt-xs"
          >
            {{ untouched }}
          </div>
          <div
            v-if="missingHeadcount"
            class="text-caption q-mt-xs"
          >
            {{ t('noHeadcount') }}
          </div>
        </q-banner>
      </div>

      <template #actions>
        <q-btn
          type="reset"
          outline
          rounded
          color="primary"
          :label="t('action.cancel')"
        />
        <q-btn
          type="submit"
          rounded
          color="primary"
          :disable="created.length + filled.length + replaced.length === 0"
          :label="t('action.plan')"
        />
      </template>
    </chore-dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import {
  type QSelectOption,
  useDialogPluginComponent,
  useQuasar,
} from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import type {
  Chore,
  ChoreAssignment,
  ChoreRotationUnit,
  ChoreSeriesConflictMode,
  ChoreSeriesPlanData,
  ChoreCreateData,
  ChoreSlot,
} from '@camp-registration/common/entities';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formatLocalDate } from '@/utils/date';
import { eachDate, requiredCount } from '@/utils/chores';
import DateRangeInput from '@/components/common/inputs/DateRangeInput.vue';
import ChoreDialogCard from '@/components/event/chorePlanner/ChoreDialogCard.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import ChoreDialog from '@/components/event/chorePlanner/dialogs/ChoreDialog.vue';
import { useChoreStore } from '@/stores/chore-store';
import { useChoreAssignmentStore } from '@/stores/chore-assignment-store';
import { usePermissions } from '@/composables/permissions';

const quasar = useQuasar();
const choreStore = useChoreStore();
const choreAssignmentStore = useChoreAssignmentStore();
const { can } = usePermissions();
const { t, locale } = useI18n();
const { to } = useObjectTranslation();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const props = defineProps<{
  chores: Chore[];
  hasRooms: boolean;
  eventStart?: string | undefined;
  eventEnd?: string | undefined;
  initialChoreId?: string | undefined;
  locales?: string[] | undefined;
  countries?: string[] | undefined;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const today = formatLocalDate(new Date());

const choreId = ref<string | null>(
  props.initialChoreId ?? props.chores[0]?.id ?? null,
);
const chores = computed<Chore[]>(() => choreStore.data ?? props.chores);
const chore = computed<Chore | undefined>(() =>
  chores.value.find((c) => c.id === choreId.value),
);
const slotIds = ref<string[]>(chore.value?.slots.map((s) => s.id) ?? []);
// From today (or the start, if the event hasn't begun) to the end.
const from = ref<string | undefined>(
  props.eventStart && props.eventStart > today ? props.eventStart : today,
);
const until = ref<string | undefined>(
  props.eventEnd && props.eventEnd >= (from.value ?? today)
    ? props.eventEnd
    : from.value,
);
const rotationUnit = ref<ChoreRotationUnit>(
  chore.value?.defaultRotationUnit ?? 'PERSON',
);
// NEW creates the missing duties; EXISTING only fills or replaces planned ones,
// so duties deleted from a plan stay deleted.
const scope = ref<'NEW' | 'EXISTING'>('NEW');
const assign = ref<boolean>(true);
const existingAction = ref<'FILL' | 'REPLACE'>('FILL');

// New duties leave every existing one alone; filling or replanning those is
// what EXISTING is for.
const conflictMode = computed<ChoreSeriesConflictMode>(() =>
  scope.value === 'EXISTING' ? existingAction.value : 'SKIP',
);

function onChoreChange() {
  slotIds.value = chore.value?.slots.map((s) => s.id) ?? [];
  rotationUnit.value = chore.value?.defaultRotationUnit ?? 'PERSON';
}

const eventDays = computed(() =>
  props.eventStart && props.eventEnd
    ? { from: props.eventStart, to: props.eventEnd }
    : undefined,
);

const choreOptions = computed<QSelectOption[]>(() =>
  chores.value.map((c) => ({ label: to(c.name), value: c.id })),
);

function toggleSlot(id: string) {
  slotIds.value = slotIds.value.includes(id)
    ? slotIds.value.filter((slotId) => slotId !== id)
    : [...slotIds.value, id];
}

const existingOptions = computed(() =>
  (['FILL', 'REPLACE'] as const).map((value) => ({
    value,
    label: t(`field.existingAction.option.${value}`),
    caption: t(`field.existingAction.caption.${value}`),
  })),
);

const dates = computed<string[]>(() =>
  from.value && until.value && from.value <= until.value
    ? eachDate(from.value, until.value)
    : [],
);

const selectedSlots = computed<(ChoreSlot | undefined)[]>(() =>
  (chore.value?.slots.length ?? 0) > 0
    ? (chore.value?.slots ?? []).filter((s) => slotIds.value.includes(s.id))
    : [undefined],
);

interface Occurrence {
  slot: ChoreSlot | undefined;
  existing: ChoreAssignment | undefined;
}

// Every duty the plan covers, matched against those planned already — the
// same way the server matches them: same chore, date and slot.
const occurrences = computed<Occurrence[]>(() => {
  const existing = new Map<string, ChoreAssignment>();
  for (const assignment of choreAssignmentStore.data ?? []) {
    const key = `${assignment.date}:${assignment.slotId ?? ''}`;
    if (assignment.choreId === choreId.value && !existing.has(key)) {
      existing.set(key, assignment);
    }
  }
  return dates.value.flatMap((date) =>
    selectedSlots.value.map((slot) => ({
      slot,
      existing: existing.get(`${date}:${slot?.id ?? ''}`),
    })),
  );
});

// Done and cancelled duties are history: the plan never touches them.
const plannedConflicts = computed<Occurrence[]>(() =>
  occurrences.value.filter((o) => o.existing?.status === 'PLANNED'),
);

// The duties in range the plan leaves as they are, said under the summary.
const untouched = computed<string | undefined>(() => {
  if (scope.value === 'NEW') {
    const existing = occurrences.value.filter((o) => o.existing).length;
    return existing > 0 ? t('kept', existing) : undefined;
  }
  const locked = occurrences.value.filter(
    (o) => o.existing && o.existing.status !== 'PLANNED',
  ).length;
  return locked > 0 ? t('locked', locked) : undefined;
});

const created = computed<Occurrence[]>(() =>
  scope.value === 'NEW' ? occurrences.value.filter((o) => !o.existing) : [],
);

const filled = computed<Occurrence[]>(() =>
  conflictMode.value === 'FILL' ? plannedConflicts.value : [],
);

// Replaced in place: the duty stays, the people on it are planned again.
const replaced = computed<Occurrence[]>(() =>
  conflictMode.value === 'REPLACE' ? plannedConflicts.value : [],
);

// What the plan does in total, so a wrong range shows before saving.
const summary = computed<string>(() => {
  if (
    created.value.length + filled.value.length + replaced.value.length ===
    0
  ) {
    return scope.value === 'NEW' ? t('nothing') : t('nothingExisting');
  }
  const staffed = assign.value ? [...created.value, ...replaced.value] : [];
  const total = (role: 'MEMBER' | 'SUPERVISOR') =>
    staffed.reduce(
      (sum, o) => sum + requiredCount(chore.value, o.slot, role),
      0,
    );
  const people = total('MEMBER');
  const supervisors = total('SUPERVISOR');
  return [
    created.value.length > 0
      ? t(assign.value ? 'summary' : 'emptySummary', created.value.length)
      : undefined,
    filled.value.length > 0 ? t('fills', filled.value.length) : undefined,
    replaced.value.length > 0
      ? t('replaces', replaced.value.length)
      : undefined,
    people > 0 ? t('people', people) : undefined,
    supervisors > 0 ? t('supervisors', supervisors) : undefined,
  ]
    .filter(Boolean)
    .join(' · ')
    .replace(/^./, (first) => first.toLocaleUpperCase(locale.value));
});

const missingHeadcount = computed<boolean>(
  () =>
    assign.value &&
    created.value.some(
      (o) => requiredCount(chore.value, o.slot, 'MEMBER') === 0,
    ),
);

async function createChore(payload: ChoreCreateData) {
  const newChore = await choreStore.createData(payload);
  if (newChore) {
    choreId.value = newChore.id;
    onChoreChange();
  }
}

function addChore() {
  quasar
    .dialog({
      component: ChoreDialog,
      componentProps: { locales: props.locales, countries: props.countries },
    })
    .onOk((payload: ChoreCreateData) => {
      void createChore(payload);
    });
}

function onOKClick() {
  if (!choreId.value || !from.value || !until.value) {
    return;
  }
  const payload: ChoreSeriesPlanData = {
    choreId: choreId.value,
    slotIds: (chore.value?.slots.length ?? 0) > 0 ? slotIds.value : [],
    from: from.value,
    to: until.value,
    rotationUnit: rotationUnit.value,
    onConflict: conflictMode.value,
    ...(scope.value === 'NEW' && !assign.value ? { assign: false } : {}),
    ...(scope.value === 'EXISTING' ? { existingOnly: true } : {}),
  };
  onDialogOK(payload);
}
</script>

<style scoped>
.chip-row {
  gap: 8px;
}

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

.replace-warning {
  gap: 6px;
  color: var(--md3-error);
}

.summary {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}
</style>

<i18n lang="yaml" locale="en">
title: 'Plan duties'
description:
  NEW: 'Creates the duties for a whole period and fills each one fairly — you can still change anything afterwards.'
  EXISTING: 'Only works on duties already planned in this range — deleted ones stay deleted.'
field:
  chore: 'Chore'
  slots: 'Slots'
  range: 'Period'
  existingAction:
    label: 'What happens to them'
    option:
      FILL: 'Fill open spots'
      REPLACE: 'Plan again'
    caption:
      FILL: 'Only free spots are filled; nobody is removed.'
      REPLACE: 'Everyone on them is replaced; the duties and their notes stay.'
  scope:
    option:
      NEW: 'New duties'
      EXISTING: 'Existing duties'
  assign:
    label: 'Assign people now'
    off: 'The duties are created without people. Remove the ones you do not need, then fill them here under “Existing duties”.'
  rotationUnit:
    label: 'Assign by'
    option:
      PERSON: 'People'
      ROOM: 'Room'
rule:
  chore: 'Pick a chore'
people: 'No people | 1 person | {n} people'
supervisors: '{n} supervisor | {n} supervisors'
summary: 'Plans 1 duty | Plans {n} duties'
fills: 'fills up 1 existing | fills up {n} existing'
replaces: 'reassigns 1 existing | reassigns {n} existing'
emptySummary: 'Creates 1 duty without people | Creates {n} duties without people'
nothingExisting: 'No planned duties in this range.'
nothing: 'Nothing to plan — every duty in this range already exists.'
kept: '1 already exists and stays as it is. | {n} already exist and stay as they are.'
locked: '1 is already done or cancelled and stays as it is. | {n} are already done or cancelled and stay as they are.'
replaceWarning: 'Removes everyone from 1 planned duty and assigns it again. | Removes everyone from {n} planned duties and assigns them again.'
noHeadcount: 'Some slots have no number of people set — those duties will be created empty.'
action:
  addChore: 'New chore'
  cancel: 'Cancel'
  plan: 'Plan'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Dienste planen'
description:
  NEW: 'Erstellt die Dienste für einen ganzen Zeitraum und besetzt jeden fair — du kannst danach alles noch ändern.'
  EXISTING: 'Nur für schon geplante Dienste in diesem Zeitraum — gelöschte bleiben gelöscht.'
field:
  chore: 'Diensttyp'
  slots: 'Zeitfenster'
  range: 'Zeitraum'
  existingAction:
    label: 'Was mit ihnen passiert'
    option:
      FILL: 'Offene Plätze besetzen'
      REPLACE: 'Neu planen'
    caption:
      FILL: 'Nur freie Plätze werden besetzt, niemand wird entfernt.'
      REPLACE: 'Alle Eingeteilten werden ersetzt; die Dienste und ihre Notizen bleiben.'
  scope:
    option:
      NEW: 'Neue Dienste'
      EXISTING: 'Bestehende Dienste'
  assign:
    label: 'Gleich Personen einteilen'
    off: 'Die Dienste werden ohne Personen erstellt. Lösche, was du nicht brauchst, und besetze sie dann hier unter „Bestehende Dienste“.'
  rotationUnit:
    label: 'Einteilen nach'
    option:
      PERSON: 'Personen'
      ROOM: 'Zimmer'
rule:
  chore: 'Wähle einen Diensttyp'
people: 'Keine Personen | 1 Person | {n} Personen'
supervisors: '{n} Aufsicht | {n} Aufsichten'
summary: 'Plant 1 Dienst | Plant {n} Dienste'
fills: 'füllt 1 bestehenden auf | füllt {n} bestehende auf'
replaces: 'teilt 1 bestehenden neu ein | teilt {n} bestehende neu ein'
emptySummary: 'Erstellt 1 Dienst ohne Personen | Erstellt {n} Dienste ohne Personen'
nothingExisting: 'In diesem Zeitraum sind keine Dienste geplant.'
nothing: 'Nichts zu planen — alle Dienste in diesem Zeitraum gibt es schon.'
kept: '1 gibt es schon, er bleibt, wie er ist. | {n} gibt es schon, sie bleiben, wie sie sind.'
locked: '1 ist schon erledigt oder abgesagt und bleibt, wie er ist. | {n} sind schon erledigt oder abgesagt und bleiben, wie sie sind.'
replaceWarning: 'Entfernt alle aus 1 geplanten Dienst und besetzt ihn neu. | Entfernt alle aus {n} geplanten Diensten und besetzt sie neu.'
noHeadcount: 'Für manche Zeitfenster ist keine Personenzahl festgelegt — diese Dienste bleiben leer.'
action:
  addChore: 'Neuer Diensttyp'
  cancel: 'Abbrechen'
  plan: 'Planen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Planifier des corvées'
description:
  NEW: 'Crée les corvées pour toute une période et les remplit équitablement — tu peux encore tout modifier ensuite.'
  EXISTING: 'Uniquement les corvées déjà prévues sur cette période — celles supprimées le restent.'
field:
  chore: 'Corvée'
  slots: 'Créneaux'
  range: 'Période'
  existingAction:
    label: 'Ce qui leur arrive'
    option:
      FILL: 'Remplir les places libres'
      REPLACE: 'Les replanifier'
    caption:
      FILL: 'Seules les places libres sont remplies, personne n’est retiré.'
      REPLACE: 'Toutes les personnes inscrites sont remplacées ; les corvées et leurs notes restent.'
  scope:
    option:
      NEW: 'Nouvelles corvées'
      EXISTING: 'Corvées existantes'
  assign:
    label: 'Attribuer les personnes maintenant'
    off: 'Les corvées sont créées sans personne. Supprime celles dont tu n’as pas besoin, puis remplis-les ici avec « Corvées existantes ».'
  rotationUnit:
    label: 'Attribuer par'
    option:
      PERSON: 'Personnes'
      ROOM: 'Chambre'
rule:
  chore: 'Choisis une corvée'
people: 'Aucune personne | 1 personne | {n} personnes'
supervisors: '{n} encadrant | {n} encadrants'
summary: 'Planifie 1 corvée | Planifie {n} corvées'
fills: 'complète 1 corvée existante | complète {n} corvées existantes'
replaces: 'réattribue 1 corvée existante | réattribue {n} corvées existantes'
emptySummary: 'Crée 1 corvée sans personne | Crée {n} corvées sans personne'
nothingExisting: 'Aucune corvée prévue sur cette période.'
nothing: 'Rien à planifier — toutes les corvées de cette période existent déjà.'
kept: '1 existe déjà et reste telle quelle. | {n} existent déjà et restent telles quelles.'
locked: '1 est déjà faite ou annulée et reste telle quelle. | {n} sont déjà faites ou annulées et restent telles quelles.'
replaceWarning: 'Retire tout le monde d’1 corvée prévue et la réattribue. | Retire tout le monde de {n} corvées prévues et les réattribue.'
noHeadcount: 'Certains créneaux n’ont pas de nombre de personnes — ces corvées seront créées vides.'
action:
  addChore: 'Nouvelle corvée'
  cancel: 'Annuler'
  plan: 'Planifier'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Zaplanuj dyżury'
description:
  NEW: 'Tworzy dyżury na cały okres i sprawiedliwie je obsadza — potem nadal możesz wszystko zmienić.'
  EXISTING: 'Tylko dyżury już zaplanowane w tym okresie — usunięte pozostają usunięte.'
field:
  chore: 'Obowiązek'
  slots: 'Przedziały czasowe'
  range: 'Okres'
  existingAction:
    label: 'Co się z nimi stanie'
    option:
      FILL: 'Uzupełnij wolne miejsca'
      REPLACE: 'Zaplanuj od nowa'
    caption:
      FILL: 'Uzupełniane są tylko wolne miejsca, nikt nie zostaje usunięty.'
      REPLACE: 'Wszystkie przydzielone osoby zostaną zastąpione; dyżury i ich notatki pozostaną.'
  scope:
    option:
      NEW: 'Nowe dyżury'
      EXISTING: 'Istniejące dyżury'
  assign:
    label: 'Od razu przydziel osoby'
    off: 'Dyżury zostaną utworzone bez osób. Usuń te, których nie potrzebujesz, a potem obsadź je tutaj w „Istniejące dyżury”.'
  rotationUnit:
    label: 'Przydziel według'
    option:
      PERSON: 'Osoby'
      ROOM: 'Pokój'
rule:
  chore: 'Wybierz obowiązek'
people: 'Brak osób | 1 osoba | {n} osób'
supervisors: '{n} opiekun | {n} opiekunów'
summary: 'Zaplanuje 1 dyżur | Zaplanuje {n} dyżurów'
fills: 'uzupełni 1 istniejący | uzupełni {n} istniejących'
replaces: 'przydzieli na nowo 1 istniejący | przydzieli na nowo {n} istniejących'
emptySummary: 'Utworzy 1 dyżur bez osób | Utworzy {n} dyżurów bez osób'
nothingExisting: 'W tym okresie nie ma zaplanowanych dyżurów.'
nothing: 'Nie ma nic do zaplanowania — wszystkie dyżury w tym okresie już istnieją.'
kept: '1 już istnieje i pozostaje bez zmian. | {n} już istnieje i pozostaje bez zmian.'
locked: '1 jest już wykonany lub odwołany i pozostaje bez zmian. | {n} jest już wykonanych lub odwołanych i pozostaje bez zmian.'
replaceWarning: 'Usuwa wszystkich z 1 zaplanowanego dyżuru i obsadza go na nowo. | Usuwa wszystkich z {n} zaplanowanych dyżurów i obsadza je na nowo.'
noHeadcount: 'Niektóre przedziały nie mają ustawionej liczby osób — te dyżury zostaną utworzone puste.'
action:
  addChore: 'Nowy obowiązek'
  cancel: 'Anuluj'
  plan: 'Zaplanuj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Naplánovat služby'
description:
  NEW: 'Vytvoří služby na celé období a každou spravedlivě obsadí — potom můžeš stále vše změnit.'
  EXISTING: 'Jen služby už naplánované v tomto období — smazané zůstanou smazané.'
field:
  chore: 'Povinnost'
  slots: 'Časové bloky'
  range: 'Období'
  existingAction:
    label: 'Co se s nimi stane'
    option:
      FILL: 'Doplnit volná místa'
      REPLACE: 'Naplánovat znovu'
    caption:
      FILL: 'Obsadí se jen volná místa, nikdo není odebrán.'
      REPLACE: 'Všichni přidělení budou nahrazeni; služby a jejich poznámky zůstanou.'
  scope:
    option:
      NEW: 'Nové služby'
      EXISTING: 'Existující služby'
  assign:
    label: 'Rovnou přidělit osoby'
    off: 'Služby se vytvoří bez osob. Smaž ty, které nepotřebuješ, a pak je obsaď tady v „Existující služby“.'
  rotationUnit:
    label: 'Přiřadit podle'
    option:
      PERSON: 'Lidé'
      ROOM: 'Pokoj'
rule:
  chore: 'Vyber povinnost'
people: 'Žádní lidé | 1 osoba | {n} lidí'
supervisors: '{n} dozor | {n} dozorů'
summary: 'Naplánuje 1 službu | Naplánuje {n} služeb'
fills: 'doplní 1 existující | doplní {n} existujících'
replaces: 'znovu přidělí 1 existující | znovu přidělí {n} existujících'
emptySummary: 'Vytvoří 1 službu bez osob | Vytvoří {n} služeb bez osob'
nothingExisting: 'V tomto období nejsou naplánované žádné služby.'
nothing: 'Není co plánovat — všechny služby v tomto období už existují.'
kept: '1 už existuje a zůstává beze změny. | {n} už existuje a zůstává beze změny.'
locked: '1 už je hotová nebo zrušená a zůstane, jak je. | {n} už je hotových nebo zrušených a zůstanou, jak jsou.'
replaceWarning: 'Odebere všechny z 1 naplánované služby a obsadí ji znovu. | Odebere všechny z {n} naplánovaných služeb a obsadí je znovu.'
noHeadcount: 'Některé bloky nemají nastavený počet lidí — tyto služby budou vytvořeny prázdné.'
action:
  addChore: 'Nová povinnost'
  cancel: 'Zrušit'
  plan: 'Naplánovat'
</i18n>
