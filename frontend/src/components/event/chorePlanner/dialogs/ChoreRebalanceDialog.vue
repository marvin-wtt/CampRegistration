<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <chore-dialog-card
      :title="t('title')"
      :subtitle="t('subtitle')"
      :width="480"
      @submit="onDialogOK(changes)"
      @cancel="onDialogCancel"
    >
      <div
        v-if="loading"
        class="column no-wrap q-gutter-y-xs"
      >
        <q-skeleton
          v-for="index in 4"
          :key="index"
          type="rect"
          height="44px"
          class="rounded-md"
        />
      </div>

      <div
        v-else-if="rows.length === 0"
        class="column no-wrap items-center q-py-lg text-center"
      >
        <q-icon
          name="task_alt"
          size="40px"
          color="positive"
        />
        <div class="text-body2 q-mt-sm">{{ t('balanced') }}</div>
      </div>

      <template v-else>
        <div class="text-body2 q-mb-sm">
          {{ t('count', rows.length) }}
        </div>
        <q-list
          separator
          bordered
          class="rounded-lg overflow-hidden"
        >
          <q-item
            v-for="row in rows"
            :key="`${row.assignmentId}:${row.role}`"
          >
            <q-item-section>
              <q-item-label caption>{{ row.duty }}</q-item-label>
              <!-- Wraps: a room hands over all of its people at once. -->
              <q-item-label class="row items-center change">
                <span>{{ row.from }}</span>
                <q-icon
                  name="arrow_forward"
                  size="16px"
                  class="col-auto"
                />
                <span class="text-weight-medium">{{ row.to }}</span>
              </q-item-label>
              <q-item-label
                v-if="row.supervisor"
                caption
              >
                {{ t('supervisor') }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </template>

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
          :disable="loading || rows.length === 0"
          :label="t('action.apply')"
        />
      </template>
    </chore-dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDialogPluginComponent } from 'quasar';
import type {
  Chore,
  ChoreRebalanceChange,
  Registration,
} from '@camp-registration/common/entities';
import { useChoreAssignmentStore } from '@/stores/chore-assignment-store';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formatPersonName } from '@/utils/formatters';
import { parseLocalDate } from '@/utils/date';
import { findSlot } from '@/utils/chores';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import ChoreDialogCard from '@/components/event/chorePlanner/ChoreDialogCard.vue';

// Previews the swaps that even out upcoming duties; resolves to them.
const props = defineProps<{
  chores: Chore[];
  registrations: Registration[];
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { t, locale } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const choreAssignmentStore = useChoreAssignmentStore();
const registrationHelper = useRegistrationHelper();
const { to } = useObjectTranslation();

const changes = ref<ChoreRebalanceChange[]>([]);
const loading = ref<boolean>(true);

async function load() {
  try {
    changes.value = await choreAssignmentStore.fetchRebalance();
  } finally {
    loading.value = false;
  }
}
void load();

const rows = computed(() => {
  const assignmentById = new Map(
    (choreAssignmentStore.data ?? []).map((a) => [a.id, a]),
  );
  const choreById = new Map(props.chores.map((c) => [c.id, c]));
  const registrationById = new Map(props.registrations.map((r) => [r.id, r]));
  const nameOf = (id: string) => {
    const registration = registrationById.get(id);
    return registration
      ? formatPersonName(registrationHelper.uniqueName(registration))
      : '?';
  };
  const namesOf = (ids: string[]) =>
    ids.length > 0 ? ids.map(nameOf).join(', ') : '—';
  const dateFormat = new Intl.DateTimeFormat(locale.value, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return changes.value
    .flatMap((change) => {
      const assignment = assignmentById.get(change.assignmentId);
      if (!assignment) {
        return [];
      }
      const chore = choreById.get(assignment.choreId);
      const slot = findSlot(chore, assignment.slotId);
      const name = chore ? to(chore.name) : '';
      return [
        {
          assignmentId: change.assignmentId,
          date: assignment.date,
          duty: [
            dateFormat.format(parseLocalDate(assignment.date)),
            slot ? `${name} — ${to(slot.name)}` : name,
          ].join(' · '),
          role: change.role,
          from: namesOf(change.fromRegistrationIds),
          to: namesOf(change.toRegistrationIds),
          supervisor: change.role === 'SUPERVISOR',
        },
      ];
    })
    .sort((a, b) => a.date.localeCompare(b.date));
});
</script>

<style scoped>
.change {
  gap: 6px;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Rebalance upcoming duties'
subtitle: 'Hands over or swaps a few upcoming duties between people and rooms with more and those with less. Today and past duties stay as they are.'
balanced: 'Everything is balanced — nothing to change.'
count: '1 change | {n} changes'
supervisor: 'as supervisor'
action:
  cancel: 'Cancel'
  apply: 'Apply'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Kommende Dienste ausgleichen'
subtitle: 'Gibt einige kommende Dienste von Leuten und Zimmern mit mehr an solche mit weniger ab oder tauscht sie. Heutige und vergangene Dienste bleiben, wie sie sind.'
balanced: 'Alles ist ausgeglichen — nichts zu ändern.'
count: '1 Änderung | {n} Änderungen'
supervisor: 'als Aufsicht'
action:
  cancel: 'Abbrechen'
  apply: 'Übernehmen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Rééquilibrer les corvées à venir'
subtitle: 'Confie ou échange quelques corvées à venir entre les personnes et chambres qui en ont plus et celles qui en ont moins. Les corvées du jour et passées ne changent pas.'
balanced: 'Tout est équilibré — rien à changer.'
count: '1 changement | {n} changements'
supervisor: 'en encadrement'
action:
  cancel: 'Annuler'
  apply: 'Appliquer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Wyrównaj nadchodzące dyżury'
subtitle: 'Przekazuje lub zamienia kilka nadchodzących dyżurów między osobami i pokojami, które mają ich więcej, a tymi, które mają mniej. Dzisiejsze i przeszłe dyżury pozostają bez zmian.'
balanced: 'Wszystko jest wyrównane — nic do zmiany.'
count: '1 zmiana | {n} zmian'
supervisor: 'jako opiekun'
action:
  cancel: 'Anuluj'
  apply: 'Zastosuj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Vyrovnat nadcházející služby'
subtitle: 'Předá nebo vymění několik nadcházejících služeb mezi lidmi a pokoji, kteří jich mají víc, a těmi, kdo jich mají méně. Dnešní a minulé služby zůstanou, jak jsou.'
balanced: 'Vše je vyrovnané — není co měnit.'
count: '1 změna | {n} změn'
supervisor: 'jako dozor'
action:
  cancel: 'Zrušit'
  apply: 'Použít'
</i18n>
