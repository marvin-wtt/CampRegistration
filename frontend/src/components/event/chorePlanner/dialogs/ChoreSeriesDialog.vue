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
          <div class="text-caption text-grey-7">{{ t('field.slots') }}</div>
          <q-list dense>
            <q-item
              v-for="slot in chore.slots"
              :key="slot.id"
              tag="label"
              class="q-px-none"
            >
              <q-item-section side>
                <q-checkbox
                  v-model="slotIds"
                  :val="slot.id"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  {{ to(slot.name) }}
                </q-item-label>
                <q-item-label caption>{{ slotSummary(slot) }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div
          v-else-if="chore"
          class="text-caption text-grey-7"
        >
          {{ slotSummary(undefined) }}
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

        <div>
          <div class="text-caption text-grey-7">
            {{ t('field.onConflict.label') }}
          </div>
          <q-option-group
            v-model="onConflict"
            :options="conflictOptions"
          />
        </div>

        <q-banner
          v-if="occurrenceCount > 0"
          dense
          class="rounded-lg summary"
        >
          <template #avatar>
            <q-icon name="auto_awesome" />
          </template>
          {{ t('summary', { count: occurrenceCount }) }}
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
          :disable="occurrenceCount === 0"
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
  ChoreRotationUnit,
  ChoreSeriesConflictMode,
  ChoreSeriesPlanData,
  ChoreCreateData,
  ChoreSlot,
} from '@camp-registration/common/entities';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formatLocalDate } from '@/utils/date';
import { eachDate, requiredCount } from '@/utils/chores';
import ChoreDateInput from '@/components/event/chorePlanner/ChoreDateInput.vue';
import ChoreDialogCard from '@/components/event/chorePlanner/ChoreDialogCard.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import ChoreDialog from '@/components/event/chorePlanner/dialogs/ChoreDialog.vue';
import { useChoreStore } from '@/stores/chore-store';
import { usePermissions } from '@/composables/permissions';

const quasar = useQuasar();
const choreStore = useChoreStore();
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

function toggleWeekday(value: number) {
  weekdays.value = weekdays.value.includes(value)
    ? weekdays.value.filter((day) => day !== value)
    : [...weekdays.value, value];
}

const conflictOptions = computed(() =>
  (['SKIP', 'FILL', 'REPLACE'] as const).map((value) => ({
    value,
    label: t(`field.onConflict.option.${value}`),
  })),
);

function slotSummary(slot: ChoreSlot | undefined): string {
  const people = requiredCount(chore.value, slot, 'MEMBER');
  const supervisors = requiredCount(chore.value, slot, 'SUPERVISOR');
  return [
    people > 0 ? t('people', people) : t('noPeople'),
    supervisors > 0 ? t('supervisors', supervisors) : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
}

const dates = computed<string[]>(() =>
  from.value && until.value && from.value <= until.value
    ? eachDate(from.value, until.value).filter((date) =>
        weekdays.value.includes(new Date(`${date}T00:00:00Z`).getUTCDay()),
      )
    : [],
);

const occurrenceCount = computed<number>(
  () =>
    dates.value.length *
    ((chore.value?.slots.length ?? 0) > 0 ? slotIds.value.length : 1),
);

const missingHeadcount = computed<boolean>(() => {
  const slots = chore.value?.slots.filter((s) => slotIds.value.includes(s.id));
  return slots && slots.length > 0
    ? slots.some((slot) => requiredCount(chore.value, slot, 'MEMBER') === 0)
    : requiredCount(chore.value, undefined, 'MEMBER') === 0;
});

async function createChore(payload: ChoreCreateData) {
  const created = await choreStore.createData(payload);
  if (created) {
    choreId.value = created.id;
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
  slots: 'Time slots'
  from: 'From'
  to: 'Until'
  weekdays: 'On these days'
  rotationUnit:
    label: 'Assign by'
    option:
      PERSON: 'People'
      ROOM: 'Room'
  onConflict:
    label: 'Where a duty is already planned'
    option:
      SKIP: 'Keep it as it is'
      FILL: 'Keep it and fill open spots'
      REPLACE: 'Replace it with a new plan'
rule:
  chore: 'Pick a chore'
people: 'No people | 1 person | {n} people'
supervisors: '{n} supervisor | {n} supervisors'
noPeople: 'Number of people not set'
summary: 'Plans {count} duties.'
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
    label: 'Wo schon ein Dienst geplant ist'
    option:
      SKIP: 'So lassen'
      FILL: 'Behalten und offene Plätze besetzen'
      REPLACE: 'Durch neue Planung ersetzen'
rule:
  chore: 'Wähle einen Diensttyp'
people: 'Keine Personen | 1 Person | {n} Personen'
supervisors: '{n} Aufsicht | {n} Aufsichten'
noPeople: 'Personenzahl nicht festgelegt'
summary: 'Plant {count} Dienste.'
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
    label: 'Quand une corvée est déjà prévue'
    option:
      SKIP: 'La laisser telle quelle'
      FILL: 'La garder et remplir les places libres'
      REPLACE: 'La remplacer par une nouvelle planification'
rule:
  chore: 'Choisis une corvée'
people: 'Aucune personne | 1 personne | {n} personnes'
supervisors: '{n} encadrant | {n} encadrants'
noPeople: 'Nombre de personnes non défini'
summary: 'Planifie {count} corvées.'
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
    label: 'Gdy dyżur jest już zaplanowany'
    option:
      SKIP: 'Zostaw bez zmian'
      FILL: 'Zostaw i uzupełnij wolne miejsca'
      REPLACE: 'Zastąp nowym planem'
rule:
  chore: 'Wybierz obowiązek'
people: 'Brak osób | 1 osoba | {n} osób'
supervisors: '{n} opiekun | {n} opiekunów'
noPeople: 'Nie ustawiono liczby osób'
summary: 'Zaplanuje {count} dyżurów.'
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
    label: 'Kde už je služba naplánovaná'
    option:
      SKIP: 'Nechat, jak je'
      FILL: 'Ponechat a obsadit volná místa'
      REPLACE: 'Nahradit novým plánem'
rule:
  chore: 'Vyber povinnost'
people: 'Žádní lidé | 1 osoba | {n} lidí'
supervisors: '{n} dozor | {n} dozorů'
noPeople: 'Počet lidí není nastaven'
summary: 'Naplánuje {count} služeb.'
noHeadcount: 'Některé bloky nemají nastavený počet lidí — tyto služby budou vytvořeny prázdné.'
action:
  addChore: 'Nová povinnost'
  cancel: 'Zrušit'
  plan: 'Naplánovat'
</i18n>
