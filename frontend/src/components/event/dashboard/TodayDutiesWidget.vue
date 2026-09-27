<template>
  <!-- Only for events that use the roster: without duties today it stays away. -->
  <q-card
    v-if="duties.length > 0"
    flat
    bordered
    class="duties-card"
  >
    <q-card-section class="row items-center no-wrap q-gutter-sm">
      <div class="duties-icon row items-center justify-center">
        <q-icon
          name="cleaning_services"
          color="primary"
          size="22px"
        />
      </div>
      <div class="col">
        <div class="text-subtitle1 text-weight-bold">{{ t('title') }}</div>
        <div class="text-caption text-grey-7">
          {{
            openCount > 0
              ? t('summary.open', openCount)
              : t('summary.filled', duties.length)
          }}
        </div>
      </div>
      <q-btn
        :label="t('action.open')"
        :to="{ name: 'management.event.chore-planner' }"
        flat
        no-caps
        dense
        color="primary"
      />
    </q-card-section>

    <q-list class="q-pb-sm">
      <q-item
        v-for="duty in duties"
        :key="duty.id"
        dense
      >
        <q-item-section>
          <q-item-label :class="{ 'text-strike': duty.cancelled }">
            {{ duty.title }}
          </q-item-label>
          <q-item-label caption>
            <span v-if="duty.names">{{ duty.names }}</span>
            <span
              v-if="duty.open > 0"
              class="open-text text-weight-medium"
            >
              {{ duty.names ? ' · ' : '' }}{{ t('open', duty.open) }}
            </span>
          </q-item-label>
        </q-item-section>
        <q-item-section
          v-if="duty.done"
          side
        >
          <q-icon
            name="task_alt"
            color="positive"
          />
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useChoreStore } from '@/stores/chore-store';
import { useChoreAssignmentStore } from '@/stores/chore-assignment-store';
import { useRegistrationsStore } from '@/stores/registration-store';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { useObjectTranslation } from '@/composables/objectTranslation';
import { formatPersonName } from '@/utils/formatters';
import { formatLocalDate } from '@/utils/date';
import { compareAssignments, findSlot, openSpots } from '@/utils/chores';

const { t } = useI18n();
const choreStore = useChoreStore();
const choreAssignmentStore = useChoreAssignmentStore();
const registrationsStore = useRegistrationsStore();
const registrationHelper = useRegistrationHelper();
const { to } = useObjectTranslation();

void choreStore.fetchData();
void choreAssignmentStore.fetchData();

const duties = computed(() => {
  const today = formatLocalDate(new Date());
  const choreById = new Map((choreStore.data ?? []).map((c) => [c.id, c]));
  const nameOf = (id: string) => {
    const registration = registrationsStore.data?.find((r) => r.id === id);
    return registration
      ? formatPersonName(registrationHelper.uniqueName(registration))
      : '?';
  };

  return (choreAssignmentStore.data ?? [])
    .filter((assignment) => assignment.date === today)
    .sort((a, b) => compareAssignments(a, b, choreById))
    .map((assignment) => {
      const chore = choreById.get(assignment.choreId);
      const slot = findSlot(chore, assignment.slotId);
      const choreName = chore ? to(chore.name) : '';
      return {
        id: assignment.id,
        title: slot ? `${choreName} — ${to(slot.name)}` : choreName,
        names: assignment.members
          .filter((m) => m.role === 'MEMBER' && !m.missed)
          .map((m) => nameOf(m.registrationId))
          .sort((a, b) => a.localeCompare(b))
          .join(', '),
        open:
          openSpots(assignment, chore, 'MEMBER') +
          openSpots(assignment, chore, 'SUPERVISOR'),
        done: assignment.status === 'DONE',
        cancelled: assignment.status === 'CANCELLED',
      };
    });
});

const openCount = computed<number>(() =>
  duties.value.reduce((sum, duty) => sum + duty.open, 0),
);
</script>

<style scoped>
.duties-card {
  border-radius: 16px;
}

.duties-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--md3-primary-container);
}

.open-text {
  color: var(--md3-on-warning-container);
}
</style>

<i18n lang="yaml" locale="en">
title: "Today's duties"
summary:
  open: 'No open spots | 1 spot still open | {n} spots still open'
  filled: 'No duties | 1 duty, fully staffed | {n} duties, all fully staffed'
open: 'no open spots | 1 spot open | {n} spots open'
action:
  open: 'Open roster'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Dienste heute'
summary:
  open: 'Keine offenen Plätze | 1 Platz noch offen | {n} Plätze noch offen'
  filled: 'Keine Dienste | 1 Dienst, voll besetzt | {n} Dienste, alle voll besetzt'
open: 'keine offenen Plätze | 1 Platz offen | {n} Plätze offen'
action:
  open: 'Zum Dienstplan'
</i18n>

<i18n lang="yaml" locale="fr">
title: "Corvées d'aujourd'hui"
summary:
  open: 'Aucune place libre | 1 place encore libre | {n} places encore libres'
  filled: 'Aucune corvée | 1 corvée, au complet | {n} corvées, toutes au complet'
open: 'aucune place libre | 1 place libre | {n} places libres'
action:
  open: 'Ouvrir le plan'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Dzisiejsze dyżury'
summary:
  open: 'Brak wolnych miejsc | 1 miejsce wciąż wolne | {n} miejsc wciąż wolnych'
  filled: 'Brak dyżurów | 1 dyżur, w pełni obsadzony | {n} dyżurów, wszystkie obsadzone'
open: 'brak wolnych miejsc | 1 wolne miejsce | {n} wolnych miejsc'
action:
  open: 'Otwórz grafik'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Dnešní služby'
summary:
  open: 'Žádná volná místa | 1 místo je ještě volné | {n} míst je ještě volných'
  filled: 'Žádné služby | 1 služba, plně obsazená | {n} služeb, všechny plně obsazené'
open: 'žádná volná místa | 1 volné místo | {n} volných míst'
action:
  open: 'Otevřít rozpis'
</i18n>
