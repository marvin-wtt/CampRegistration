<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <chore-dialog-card
      :title="t('title')"
      :subtitle="t('description')"
      :width="560"
      @submit="onOKClick"
      @cancel="onDialogCancel"
    >
      <div class="q-gutter-y-md column no-wrap">
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

        <div v-if="hasRooms && chore?.eligibility !== 'STAFF'">
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

        <div class="field-grid field-grid--2">
          <chore-date-input
            v-model="from"
            :label="t('field.from')"
          />
          <chore-date-input
            v-model="until"
            :label="t('field.to')"
            :min="from ?? undefined"
          />
        </div>

        <div>
          <div class="text-caption text-grey-7 q-mb-xs">
            {{ t('field.weekdays') }}
          </div>
          <div class="chip-row row">
            <q-chip
              v-for="weekday in weekdayOptions"
              :key="weekday.value"
              clickable
              class="filter-chip"
              :class="{
                'filter-chip--active': weekdays.includes(weekday.value),
              }"
              @click="toggleWeekday(weekday.value)"
            >
              {{ weekday.label }}
            </q-chip>
          </div>
        </div>

        <!-- Only when the plan runs into duties that exist already. -->
        <div v-if="plannedConflicts.length > 0">
          <div class="text-body2 q-mb-xs">
            {{ t('field.onConflict.label', plannedConflicts.length) }}
          </div>
          <q-option-group
            v-model="onConflict"
            :options="conflictOptions"
          >
            <template #label="option">
              <div>{{ option.label }}</div>
              <div class="text-caption text-grey-7">{{ option.caption }}</div>
            </template>
          </q-option-group>
          <div
            v-if="onConflict === 'REPLACE'"
            class="replace-warning row items-center no-wrap q-mt-xs"
          >
            <q-icon
              name="warning_amber"
              size="18px"
            />
            <span class="text-caption">
              {{ t('replaceWarning', plannedConflicts.length) }}
            </span>
          </div>
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
            v-if="lockedConflicts > 0"
            class="text-caption q-mt-xs"
          >
            {{ t('locked', lockedConflicts) }}
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
          :disable="created.length + filled.length === 0"
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
import { eachDate, requiredCount } from '@/features/chores/utils/chores';
import ChoreDateInput from '@/features/chores/components/ChoreDateInput.vue';
import ChoreDialogCard from '@/features/chores/components/ChoreDialogCard.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import ChoreDialog from '@/features/chores/components/dialogs/ChoreDialog.vue';
import { useChoreStore } from '@/features/chores/stores/chore-store';
import { useChoreAssignmentStore } from '@/features/chores/stores/chore-assignment-store';
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
const from = ref<string | null>(
  props.eventStart && props.eventStart > today ? props.eventStart : today,
);
const until = ref<string | null>(
  props.eventEnd && props.eventEnd >= (from.value ?? today)
    ? props.eventEnd
    : from.value,
);
const weekdays = ref<number[]>([0, 1, 2, 3, 4, 5, 6]);
const rotationUnit = ref<ChoreRotationUnit>(
  chore.value?.defaultRotationUnit ?? 'PERSON',
);
const onConflict = ref<ChoreSeriesConflictMode>('SKIP');

function onChoreChange() {
  slotIds.value = chore.value?.slots.map((s) => s.id) ?? [];
  rotationUnit.value = chore.value?.defaultRotationUnit ?? 'PERSON';
}

const choreOptions = computed<QSelectOption[]>(() =>
  chores.value.map((c) => ({ label: to(c.name), value: c.id })),
);

// Monday first; values follow `Date.getDay()`.
const weekdayOptions = computed(() => {
  const format = new Intl.DateTimeFormat(locale.value, { weekday: 'short' });
  return [1, 2, 3, 4, 5, 6, 0].map((value) => ({
    value,
    // 2024-01-07 was a Sunday.
    label: format.format(new Date(2024, 0, 7 + value)),
  }));
});

function toggleSlot(id: string) {
  slotIds.value = slotIds.value.includes(id)
    ? slotIds.value.filter((slotId) => slotId !== id)
    : [...slotIds.value, id];
}

function toggleWeekday(value: number) {
  weekdays.value = weekdays.value.includes(value)
    ? weekdays.value.filter((day) => day !== value)
    : [...weekdays.value, value];
}

const conflictOptions = computed(() =>
  (['SKIP', 'FILL', 'REPLACE'] as const).map((value) => ({
    value,
    label: t(`field.onConflict.option.${value}`),
    caption: t(`field.onConflict.caption.${value}`),
  })),
);

const dates = computed<string[]>(() =>
  from.value && until.value && from.value <= until.value
    ? eachDate(from.value, until.value).filter((date) =>
        weekdays.value.includes(new Date(`${date}T00:00:00Z`).getUTCDay()),
      )
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

const lockedConflicts = computed<number>(
  () =>
    occurrences.value.filter(
      (o) => o.existing && o.existing.status !== 'PLANNED',
    ).length,
);

const created = computed<Occurrence[]>(() =>
  occurrences.value.filter(
    (o) =>
      !o.existing ||
      (o.existing.status === 'PLANNED' && onConflict.value === 'REPLACE'),
  ),
);

const filled = computed<Occurrence[]>(() =>
  onConflict.value === 'FILL' ? plannedConflicts.value : [],
);

// What the plan does in total, so a wrong range shows before saving.
const summary = computed<string>(() => {
  if (created.value.length + filled.value.length === 0) {
    return t('nothing');
  }
  const total = (role: 'MEMBER' | 'SUPERVISOR') =>
    created.value.reduce(
      (sum, o) => sum + requiredCount(chore.value, o.slot, role),
      0,
    );
  const people = total('MEMBER');
  const supervisors = total('SUPERVISOR');
  return [
    created.value.length > 0 ? t('summary', created.value.length) : undefined,
    filled.value.length > 0 ? t('fills', filled.value.length) : undefined,
    people > 0 ? t('people', people) : undefined,
    supervisors > 0 ? t('supervisors', supervisors) : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
});

const missingHeadcount = computed<boolean>(() =>
  created.value.some((o) => requiredCount(chore.value, o.slot, 'MEMBER') === 0),
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
    ...(weekdays.value.length < 7 ? { weekdays: weekdays.value } : {}),
    rotationUnit: rotationUnit.value,
    onConflict: onConflict.value,
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
description: 'Creates the duties for a whole period and fills each one fairly — you can still change anything afterwards.'
field:
  chore: 'Chore'
  slots: 'Slots'
  from: 'From'
  to: 'Until'
  weekdays: 'On these days'
  rotationUnit:
    label: 'Assign by'
    option:
      PERSON: 'People'
      ROOM: 'Room'
  onConflict:
    label: '1 of these duties is already planned. What should happen to it? | {n} of these duties are already planned. What should happen to them?'
    option:
      SKIP: 'Keep as they are'
      FILL: 'Keep and fill open spots'
      REPLACE: 'Plan again'
    caption:
      SKIP: 'Nothing changes on those duties.'
      FILL: 'Only free spots are filled; nobody is removed.'
      REPLACE: 'They are deleted and planned again from scratch.'
rule:
  chore: 'Pick a chore'
people: 'No people | 1 person | {n} people'
supervisors: '{n} supervisor | {n} supervisors'
summary: 'Plans 1 duty | Plans {n} duties'
fills: 'fills up 1 existing | fills up {n} existing'
nothing: 'Nothing to plan — every duty in this range already exists.'
locked: '1 is already done or cancelled and stays as it is. | {n} are already done or cancelled and stay as they are.'
replaceWarning: 'Deletes 1 planned duty and who is on it. | Deletes {n} planned duties and who is on them.'
noHeadcount: 'Some slots have no number of people set — those duties will be created empty.'
action:
  addChore: 'New chore'
  cancel: 'Cancel'
  plan: 'Plan'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Dienste planen'
description: 'Erstellt die Dienste für einen ganzen Zeitraum und besetzt jeden fair — du kannst danach alles noch ändern.'
field:
  chore: 'Diensttyp'
  slots: 'Zeitfenster'
  from: 'Von'
  to: 'Bis'
  weekdays: 'An diesen Tagen'
  rotationUnit:
    label: 'Einteilen nach'
    option:
      PERSON: 'Personen'
      ROOM: 'Zimmer'
  onConflict:
    label: '1 dieser Dienste ist schon geplant. Was soll damit passieren? | {n} dieser Dienste sind schon geplant. Was soll damit passieren?'
    option:
      SKIP: 'So lassen'
      FILL: 'Behalten und offene Plätze besetzen'
      REPLACE: 'Neu planen'
    caption:
      SKIP: 'An diesen Diensten ändert sich nichts.'
      FILL: 'Nur freie Plätze werden besetzt, niemand wird entfernt.'
      REPLACE: 'Sie werden gelöscht und komplett neu geplant.'
rule:
  chore: 'Wähle einen Diensttyp'
people: 'Keine Personen | 1 Person | {n} Personen'
supervisors: '{n} Aufsicht | {n} Aufsichten'
summary: 'Plant 1 Dienst | Plant {n} Dienste'
fills: 'füllt 1 bestehenden auf | füllt {n} bestehende auf'
nothing: 'Nichts zu planen — alle Dienste in diesem Zeitraum gibt es schon.'
locked: '1 ist schon erledigt oder abgesagt und bleibt, wie er ist. | {n} sind schon erledigt oder abgesagt und bleiben, wie sie sind.'
replaceWarning: 'Löscht 1 geplanten Dienst samt Besetzung. | Löscht {n} geplante Dienste samt Besetzung.'
noHeadcount: 'Für manche Zeitfenster ist keine Personenzahl festgelegt — diese Dienste bleiben leer.'
action:
  addChore: 'Neuer Diensttyp'
  cancel: 'Abbrechen'
  plan: 'Planen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Planifier des corvées'
description: 'Crée les corvées pour toute une période et les remplit équitablement — tu peux encore tout modifier ensuite.'
field:
  chore: 'Corvée'
  slots: 'Créneaux'
  from: 'Du'
  to: 'Au'
  weekdays: 'Ces jours-là'
  rotationUnit:
    label: 'Attribuer par'
    option:
      PERSON: 'Personnes'
      ROOM: 'Chambre'
  onConflict:
    label: '1 de ces corvées est déjà prévue. Que faut-il en faire ? | {n} de ces corvées sont déjà prévues. Que faut-il en faire ?'
    option:
      SKIP: 'Les laisser telles quelles'
      FILL: 'Les garder et remplir les places libres'
      REPLACE: 'Les replanifier'
    caption:
      SKIP: 'Rien ne change pour ces corvées.'
      FILL: 'Seules les places libres sont remplies, personne n’est retiré.'
      REPLACE: 'Elles sont supprimées et replanifiées de zéro.'
rule:
  chore: 'Choisis une corvée'
people: 'Aucune personne | 1 personne | {n} personnes'
supervisors: '{n} encadrant | {n} encadrants'
summary: 'Planifie 1 corvée | Planifie {n} corvées'
fills: 'complète 1 corvée existante | complète {n} corvées existantes'
nothing: 'Rien à planifier — toutes les corvées de cette période existent déjà.'
locked: '1 est déjà faite ou annulée et reste telle quelle. | {n} sont déjà faites ou annulées et restent telles quelles.'
replaceWarning: 'Supprime 1 corvée prévue et les personnes inscrites. | Supprime {n} corvées prévues et les personnes inscrites.'
noHeadcount: 'Certains créneaux n’ont pas de nombre de personnes — ces corvées seront créées vides.'
action:
  addChore: 'Nouvelle corvée'
  cancel: 'Annuler'
  plan: 'Planifier'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Zaplanuj dyżury'
description: 'Tworzy dyżury na cały okres i sprawiedliwie je obsadza — potem nadal możesz wszystko zmienić.'
field:
  chore: 'Obowiązek'
  slots: 'Przedziały czasowe'
  from: 'Od'
  to: 'Do'
  weekdays: 'W te dni'
  rotationUnit:
    label: 'Przydziel według'
    option:
      PERSON: 'Osoby'
      ROOM: 'Pokój'
  onConflict:
    label: '1 z tych dyżurów jest już zaplanowany. Co z nim zrobić? | {n} z tych dyżurów jest już zaplanowanych. Co z nimi zrobić?'
    option:
      SKIP: 'Zostaw bez zmian'
      FILL: 'Zostaw i uzupełnij wolne miejsca'
      REPLACE: 'Zaplanuj od nowa'
    caption:
      SKIP: 'Te dyżury się nie zmienią.'
      FILL: 'Uzupełniane są tylko wolne miejsca, nikt nie zostaje usunięty.'
      REPLACE: 'Zostaną usunięte i zaplanowane od nowa.'
rule:
  chore: 'Wybierz obowiązek'
people: 'Brak osób | 1 osoba | {n} osób'
supervisors: '{n} opiekun | {n} opiekunów'
summary: 'Zaplanuje 1 dyżur | Zaplanuje {n} dyżurów'
fills: 'uzupełni 1 istniejący | uzupełni {n} istniejących'
nothing: 'Nie ma nic do zaplanowania — wszystkie dyżury w tym okresie już istnieją.'
locked: '1 jest już wykonany lub odwołany i pozostaje bez zmian. | {n} jest już wykonanych lub odwołanych i pozostaje bez zmian.'
replaceWarning: 'Usuwa 1 zaplanowany dyżur wraz z obsadą. | Usuwa {n} zaplanowanych dyżurów wraz z obsadą.'
noHeadcount: 'Niektóre przedziały nie mają ustawionej liczby osób — te dyżury zostaną utworzone puste.'
action:
  addChore: 'Nowy obowiązek'
  cancel: 'Anuluj'
  plan: 'Zaplanuj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Naplánovat služby'
description: 'Vytvoří služby na celé období a každou spravedlivě obsadí — potom můžeš stále vše změnit.'
field:
  chore: 'Povinnost'
  slots: 'Časové bloky'
  from: 'Od'
  to: 'Do'
  weekdays: 'V tyto dny'
  rotationUnit:
    label: 'Přiřadit podle'
    option:
      PERSON: 'Lidé'
      ROOM: 'Pokoj'
  onConflict:
    label: '1 z těchto služeb už je naplánovaná. Co s ní? | {n} z těchto služeb už je naplánováno. Co s nimi?'
    option:
      SKIP: 'Nechat, jak jsou'
      FILL: 'Ponechat a obsadit volná místa'
      REPLACE: 'Naplánovat znovu'
    caption:
      SKIP: 'Na těchto službách se nic nezmění.'
      FILL: 'Obsadí se jen volná místa, nikdo není odebrán.'
      REPLACE: 'Budou smazány a naplánovány úplně znovu.'
rule:
  chore: 'Vyber povinnost'
people: 'Žádní lidé | 1 osoba | {n} lidí'
supervisors: '{n} dozor | {n} dozorů'
summary: 'Naplánuje 1 službu | Naplánuje {n} služeb'
fills: 'doplní 1 existující | doplní {n} existujících'
nothing: 'Není co plánovat — všechny služby v tomto období už existují.'
locked: '1 už je hotová nebo zrušená a zůstane, jak je. | {n} už je hotových nebo zrušených a zůstanou, jak jsou.'
replaceWarning: 'Smaže 1 naplánovanou službu i s obsazením. | Smaže {n} naplánovaných služeb i s obsazením.'
noHeadcount: 'Některé bloky nemají nastavený počet lidí — tyto služby budou vytvořeny prázdné.'
action:
  addChore: 'Nová povinnost'
  cancel: 'Zrušit'
  plan: 'Naplánovat'
</i18n>
