<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <chore-dialog-card
      :title="isEdit ? t('title.edit') : t('title.create')"
      :width="640"
      @submit="onOKClick"
      @cancel="onDialogCancel"
    >
      <div class="q-gutter-y-md column no-wrap">
        <translated-input
          v-model="data.name"
          :label="t('field.name.label')"
          :rules="[
            (val: string | Record<string, string> | undefined) =>
              !!val || t('field.name.rule.required'),
          ]"
          :locales="locales"
          hide-bottom-space
          autofocus
          outlined
          rounded
        >
          <template #prepend>
            <q-icon name="checklist" />
          </template>
        </translated-input>

        <div>
          <div class="text-caption text-grey-7 q-mb-xs">
            {{ t('field.eligibility.label') }}
          </div>
          <!-- Not `spread`: equal widths would clip the longest label on a
               phone; sized by content, all three fit. -->
          <q-btn-toggle
            v-model="data.eligibility"
            class="full-width compact-toggle eligibility-toggle"
            no-caps
            rounded
            unelevated
            toggle-color="primary"
            :options="eligibilityOptions"
          />
          <div class="text-caption text-grey-7 q-mt-xs">
            {{ t(`field.eligibility.hint.${data.eligibility}`) }}
          </div>
        </div>

        <!-- Either the chore carries the numbers, or each of its slots does —
             never both, so nothing is inherited out of sight. -->
        <div>
          <div class="text-caption text-grey-7 q-mb-xs">
            {{ t('field.schedule.label') }}
          </div>
          <q-btn-toggle
            :model-value="mode"
            class="full-width compact-toggle"
            spread
            no-caps
            rounded
            unelevated
            toggle-color="primary"
            :options="modeOptions"
            @update:model-value="setMode"
          />
          <div class="text-caption text-grey-7 q-mt-xs">
            {{
              mode === 'SLOTS' && slotsInUse
                ? t('field.schedule.inUse')
                : t(`field.schedule.hint.${mode}`)
            }}
          </div>
        </div>

        <chore-requirements
          v-if="mode === 'SINGLE'"
          v-model:effort="data.effort"
          v-model:headcount="headcount"
          v-model:supervisor-count="data.supervisorCount"
        />

        <div
          v-else
          class="column no-wrap q-gutter-y-md"
        >
          <div
            v-for="(slot, index) in slots"
            :key="slot.key"
            class="slot-row rounded-lg q-pa-sm"
          >
            <div class="row items-center no-wrap">
              <div class="col text-caption text-grey-7">
                {{ t('field.slotNumber', { number: index + 1 }) }}
              </div>
              <q-btn
                icon="arrow_upward"
                flat
                round
                :disable="index === 0"
                :aria-label="t('action.moveUp')"
                @click="moveSlot(index, -1)"
              />
              <q-btn
                icon="arrow_downward"
                flat
                round
                :disable="index === slots.length - 1"
                :aria-label="t('action.moveDown')"
                @click="moveSlot(index, 1)"
              />
              <q-btn
                icon="delete"
                flat
                round
                color="negative"
                :disable="isUsed(slot)"
                :aria-label="t('action.removeSlot')"
                @click="removeSlot(index)"
              >
                <q-tooltip v-if="isUsed(slot)">
                  {{ t('action.slotInUse') }}
                </q-tooltip>
              </q-btn>
            </div>

            <div class="field-grid field-grid--wide-narrow">
              <translated-input
                v-model="slot.name"
                :label="t('field.slotName.label')"
                :rules="[
                  (val: string | Record<string, string> | undefined) =>
                    !!val || t('field.slotName.rule.required'),
                ]"
                :locales="locales"
                hide-bottom-space
                dense
                outlined
                rounded
              />
              <q-input
                v-model="slot.time"
                type="time"
                :label="t('field.slotTime.label')"
                stack-label
                clearable
                dense
                outlined
                rounded
              />
            </div>

            <chore-requirements
              v-model:effort="slot.effort"
              v-model:headcount="slot.headcount"
              v-model:supervisor-count="slot.supervisorCount"
              class="q-mt-sm"
              compact
            />
          </div>

          <div>
            <q-btn
              icon="add"
              :label="t('action.addSlot')"
              color="primary"
              outline
              rounded
              no-caps
              @click="addSlot"
            />
          </div>
        </div>

        <q-item
          v-if="hasMultipleCountries"
          tag="label"
          class="q-px-none"
        >
          <q-item-section>
            <q-item-label>
              {{ t('field.balanceCountries.label') }}
            </q-item-label>
            <q-item-label caption>
              {{ t('field.balanceCountries.hint') }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle v-model="data.balanceCountries" />
          </q-item-section>
        </q-item>
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
          :label="isEdit ? t('action.save') : t('action.create')"
        />
      </template>
    </chore-dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, reactive, ref } from 'vue';
import type {
  Chore,
  ChoreCreateData,
  ChoreEffort,
  ChoreEligibility,
  Translatable,
} from '@camp-registration/common/entities';
import { useChoreAssignmentStore } from '@/stores/chore-assignment-store';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';
import ChoreDialogCard from '@/components/event/chorePlanner/ChoreDialogCard.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import ChoreRequirements from '@/components/event/chorePlanner/ChoreRequirements.vue';

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const choreAssignmentStore = useChoreAssignmentStore();

const props = defineProps<{
  chore?: Chore;
  locales?: string[];
  countries?: string[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

type Mode = 'SINGLE' | 'SLOTS';

interface EditableSlot {
  id: string | undefined;
  // Stable v-for key, also for slots that don't have an id yet.
  key: number;
  name: Translatable;
  time: string | null;
  headcount: number;
  supervisorCount: number;
  effort: ChoreEffort;
}

const isEdit = computed<boolean>(() => props.chore !== undefined);
const hasMultipleCountries = computed<boolean>(
  () => (props.countries?.length ?? 0) > 1,
);

const data = reactive<Required<Omit<ChoreCreateData, 'slots'>>>({
  name: props.chore?.name ?? '',
  defaultCount: props.chore?.defaultCount ?? null,
  supervisorCount: props.chore?.supervisorCount ?? 0,
  eligibility: props.chore?.eligibility ?? 'PARTICIPANTS',
  effort: props.chore?.effort ?? 'NORMAL',
  defaultRotationUnit: props.chore?.defaultRotationUnit ?? 'PERSON',
  balanceCountries: props.chore?.balanceCountries ?? false,
});

// The stepper counts from 0; the chore stores "not set" as null.
const headcount = computed<number>({
  get: () => data.defaultCount ?? 0,
  set: (value) => (data.defaultCount = value || null),
});

let nextKey = 0;
// Slots that used to inherit from the chore get its values spelled out.
const slots = ref<EditableSlot[]>(
  (props.chore?.slots ?? []).map((slot) => ({
    id: slot.id,
    key: nextKey++,
    name: slot.name,
    time: slot.time,
    headcount: slot.headcount ?? data.defaultCount ?? 0,
    supervisorCount: slot.supervisorCount ?? data.supervisorCount,
    effort: slot.effort ?? data.effort,
  })),
);

const mode = ref<Mode>(slots.value.length > 0 ? 'SLOTS' : 'SINGLE');

// Slots planned duties point at can't be deleted (the server refuses too).
const usedSlotIds = computed<Set<string>>(
  () =>
    new Set(
      (choreAssignmentStore.data ?? []).flatMap((assignment) =>
        assignment.choreId === props.chore?.id && assignment.slotId
          ? [assignment.slotId]
          : [],
      ),
    ),
);

function isUsed(slot: EditableSlot): boolean {
  return !!slot.id && usedSlotIds.value.has(slot.id);
}

const slotsInUse = computed<boolean>(() => slots.value.some(isUsed));

const ELIGIBILITIES: ChoreEligibility[] = ['PARTICIPANTS', 'STAFF', 'EVERYONE'];

const eligibilityOptions = computed(() =>
  ELIGIBILITIES.map((value) => ({
    value,
    label: t(`field.eligibility.option.${value}`),
  })),
);

const modeOptions = computed(() => [
  {
    value: 'SINGLE',
    label: t('field.schedule.option.SINGLE'),
    disable: slotsInUse.value,
  },
  { value: 'SLOTS', label: t('field.schedule.option.SLOTS') },
]);

function newSlot(from: Omit<EditableSlot, 'id' | 'key' | 'name' | 'time'>) {
  return {
    id: undefined,
    key: nextKey++,
    name: '',
    time: null,
    headcount: from.headcount,
    supervisorCount: from.supervisorCount,
    effort: from.effort,
  };
}

function choreValues() {
  return {
    headcount: data.defaultCount ?? 0,
    supervisorCount: data.supervisorCount,
    effort: data.effort,
  };
}

// Switching carries the numbers across, so nothing typed is lost.
function setMode(value: Mode) {
  if (value === 'SLOTS' && slots.value.length === 0) {
    slots.value.push(newSlot(choreValues()));
  }
  if (value === 'SINGLE') {
    takeOverFirstSlot();
  }
  mode.value = value;
}

function takeOverFirstSlot() {
  const first = slots.value[0];
  if (first) {
    data.defaultCount = first.headcount || null;
    data.supervisorCount = first.supervisorCount;
    data.effort = first.effort;
  }
}

// Copies the previous slot's numbers: slots of one chore are usually alike.
function addSlot() {
  slots.value.push(newSlot(slots.value.at(-1) ?? choreValues()));
}

function removeSlot(index: number) {
  if (slots.value.length === 1) {
    setMode('SINGLE');
  }
  slots.value.splice(index, 1);
}

function moveSlot(index: number, offset: number) {
  const [slot] = slots.value.splice(index, 1);
  if (slot) {
    slots.value.splice(index + offset, 0, slot);
  }
}

function onOKClick(): void {
  // The chore keeps the first slot's numbers, for when slots are dropped.
  if (mode.value === 'SLOTS') {
    takeOverFirstSlot();
  }
  const payload: ChoreCreateData = {
    ...data,
    slots:
      mode.value === 'SLOTS'
        ? slots.value.map((slot) => ({
            ...(slot.id ? { id: slot.id } : {}),
            name: slot.name,
            time: slot.time || null,
            headcount: slot.headcount,
            supervisorCount: slot.supervisorCount,
            effort: slot.effort,
          }))
        : [],
  };

  onDialogOK(payload);
}
</script>

<style scoped>
.eligibility-toggle :deep(.q-btn) {
  flex: 1 1 auto;
}

.slot-row {
  border: 1px solid var(--md3-outline-variant);
  background: var(--md3-surface-container-low);
}
</style>

<i18n lang="yaml" locale="en">
title:
  create: 'Add chore'
  edit: 'Edit chore'
field:
  name:
    label: 'Name'
    rule:
      required: 'The name is required'
  eligibility:
    label: 'Who does it?'
    option:
      PARTICIPANTS: 'Participants'
      STAFF: 'Staff'
      EVERYONE: 'Everyone'
    hint:
      PARTICIPANTS: 'Only participants take this duty.'
      STAFF: 'Everyone registered who isn’t a participant.'
      EVERYONE: 'Participants and staff alike. Each is still compared only with their own group.'
  slotNumber: 'Slot {number}'
  slotName:
    label: 'Name'
    rule:
      required: 'The name is required'
  slotTime:
    label: 'Time'
  balanceCountries:
    label: 'Balance countries'
    hint: 'Nice to have — try to spread suggested participants across countries. Fairness always comes first.'
  schedule:
    label: 'When does this duty happen?'
    option:
      SINGLE: 'No fixed time'
      SLOTS: 'At fixed times'
    hint:
      SINGLE: 'E.g. trash, cleaning or night watch.'
      SLOTS: 'E.g. Breakfast, Lunch and Dinner — each with its own numbers.'
    inUse: 'Duties use these time slots, so they have to stay.'
action:
  addSlot: 'Add slot'
  removeSlot: 'Remove slot'
  moveUp: 'Move up'
  moveDown: 'Move down'
  cancel: 'Cancel'
  create: 'Create'
  save: 'Save'
  slotInUse: 'In use by duties'
</i18n>

<i18n lang="yaml" locale="de">
title:
  create: 'Diensttyp hinzufügen'
  edit: 'Diensttyp bearbeiten'
field:
  name:
    label: 'Name'
    rule:
      required: 'Der Name ist erforderlich'
  eligibility:
    label: 'Wer übernimmt den Dienst?'
    option:
      PARTICIPANTS: 'Teilnehmende'
      STAFF: 'Betreuende'
      EVERYONE: 'Alle'
    hint:
      PARTICIPANTS: 'Nur Teilnehmende übernehmen diesen Dienst.'
      STAFF: 'Alle Angemeldeten, die keine Teilnehmenden sind.'
      EVERYONE: 'Teilnehmende und Betreuende gleichermaßen. Verglichen wird trotzdem nur innerhalb der eigenen Gruppe.'
  slotNumber: 'Zeitfenster {number}'
  slotName:
    label: 'Name'
    rule:
      required: 'Der Name ist erforderlich'
  slotTime:
    label: 'Uhrzeit'
  balanceCountries:
    label: 'Länder ausgleichen'
    hint: 'Optional — versucht, vorgeschlagene Teilnehmende über Länder zu streuen. Fairness hat immer Vorrang.'
  schedule:
    label: 'Wann findet der Dienst statt?'
    option:
      SINGLE: 'Ohne feste Zeit'
      SLOTS: 'Zu festen Zeiten'
    hint:
      SINGLE: 'Z. B. Müll, Putzen oder Nachtwache.'
      SLOTS: 'Z. B. Frühstück, Mittag- und Abendessen — jedes mit eigenen Angaben.'
    inUse: 'Dienste nutzen diese Zeitfenster, deshalb bleiben sie bestehen.'
action:
  addSlot: 'Zeitfenster'
  removeSlot: 'Zeitfenster entfernen'
  moveUp: 'Nach oben'
  moveDown: 'Nach unten'
  cancel: 'Abbrechen'
  create: 'Erstellen'
  save: 'Speichern'
  slotInUse: 'Von Diensten genutzt'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  create: 'Ajouter une corvée'
  edit: 'Modifier la corvée'
field:
  name:
    label: 'Nom'
    rule:
      required: 'Le nom est requis'
  eligibility:
    label: 'Qui s’en charge ?'
    option:
      PARTICIPANTS: 'Participants'
      STAFF: 'Encadrement'
      EVERYONE: 'Tous'
    hint:
      PARTICIPANTS: 'Seuls les participants assurent cette corvée.'
      STAFF: 'Toutes les personnes inscrites qui ne sont pas participantes.'
      EVERYONE: 'Participants et encadrement. Chacun reste comparé uniquement à son propre groupe.'
  slotNumber: 'Créneau {number}'
  slotName:
    label: 'Nom'
    rule:
      required: 'Le nom est requis'
  slotTime:
    label: 'Heure'
  balanceCountries:
    label: 'Équilibrer les pays'
    hint: "Bonus — essaie de répartir les participants suggérés entre les pays. L'équité reste toujours prioritaire."
  schedule:
    label: 'Quand la corvée a-t-elle lieu ?'
    option:
      SINGLE: 'Sans horaire fixe'
      SLOTS: 'À horaires fixes'
    hint:
      SINGLE: 'Par ex. poubelles, ménage ou veille de nuit.'
      SLOTS: 'Par ex. petit-déjeuner, déjeuner et dîner — chacun avec ses propres réglages.'
    inUse: 'Des corvées utilisent ces créneaux, ils doivent donc rester.'
action:
  addSlot: 'Créneau'
  removeSlot: 'Supprimer le créneau'
  moveUp: 'Monter'
  moveDown: 'Descendre'
  cancel: 'Annuler'
  create: 'Créer'
  save: 'Enregistrer'
  slotInUse: 'Utilisé par des corvées'
</i18n>

<i18n lang="yaml" locale="pl">
title:
  create: 'Dodaj obowiązek'
  edit: 'Edytuj obowiązek'
field:
  name:
    label: 'Nazwa'
    rule:
      required: 'Nazwa jest wymagana'
  eligibility:
    label: 'Kto to robi?'
    option:
      PARTICIPANTS: 'Uczestnicy'
      STAFF: 'Kadra'
      EVERYONE: 'Wszyscy'
    hint:
      PARTICIPANTS: 'Ten dyżur pełnią tylko uczestnicy.'
      STAFF: 'Wszyscy zapisani, którzy nie są uczestnikami.'
      EVERYONE: 'Uczestnicy i kadra. Każdy jest porównywany tylko z własną grupą.'
  slotNumber: 'Przedział {number}'
  slotName:
    label: 'Nazwa'
    rule:
      required: 'Nazwa jest wymagana'
  slotTime:
    label: 'Godzina'
  balanceCountries:
    label: 'Równoważ kraje'
    hint: 'Miło mieć — spróbuj rozłożyć sugerowanych uczestników pomiędzy kraje. Sprawiedliwość zawsze ma pierwszeństwo.'
  schedule:
    label: 'Kiedy odbywa się dyżur?'
    option:
      SINGLE: 'Bez stałej godziny'
      SLOTS: 'O stałych porach'
    hint:
      SINGLE: 'Np. śmieci, sprzątanie lub nocny dyżur.'
      SLOTS: 'Np. śniadanie, obiad i kolacja — każdy z własnymi ustawieniami.'
    inUse: 'Dyżury korzystają z tych przedziałów, więc muszą zostać.'
action:
  addSlot: 'Przedział'
  removeSlot: 'Usuń przedział'
  moveUp: 'W górę'
  moveDown: 'W dół'
  cancel: 'Anuluj'
  create: 'Utwórz'
  save: 'Zapisz'
  slotInUse: 'Używany przez dyżury'
</i18n>

<i18n lang="yaml" locale="cs">
title:
  create: 'Přidat povinnost'
  edit: 'Upravit povinnost'
field:
  name:
    label: 'Název'
    rule:
      required: 'Název je povinný'
  eligibility:
    label: 'Kdo ji dělá?'
    option:
      PARTICIPANTS: 'Účastníci'
      STAFF: 'Vedoucí'
      EVERYONE: 'Všichni'
    hint:
      PARTICIPANTS: 'Tuto službu dělají jen účastníci.'
      STAFF: 'Všichni přihlášení, kteří nejsou účastníky.'
      EVERYONE: 'Účastníci i vedoucí. Každý se přesto porovnává jen se svou skupinou.'
  slotNumber: 'Blok {number}'
  slotName:
    label: 'Název'
    rule:
      required: 'Název je povinný'
  slotTime:
    label: 'Čas'
  balanceCountries:
    label: 'Vyvážit země'
    hint: 'Bonus — zkusí rozložit navrhované účastníky mezi země. Spravedlnost má vždy přednost.'
  schedule:
    label: 'Kdy se služba koná?'
    option:
      SINGLE: 'Bez pevného času'
      SLOTS: 'V pevných časech'
    hint:
      SINGLE: 'Např. odpadky, úklid nebo noční hlídka.'
      SLOTS: 'Např. snídaně, oběd a večeře — každý s vlastním nastavením.'
    inUse: 'Tyto časové bloky používají služby, proto musí zůstat.'
action:
  addSlot: 'Časový blok'
  removeSlot: 'Odebrat časový blok'
  moveUp: 'Nahoru'
  moveDown: 'Dolů'
  cancel: 'Zrušit'
  create: 'Vytvořit'
  save: 'Uložit'
  slotInUse: 'Používáno službami'
</i18n>
