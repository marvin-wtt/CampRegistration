<template>
  <!-- What a duty needs — on the chore, or on each of its time slots. -->
  <div class="column no-wrap q-gutter-y-md">
    <div>
      <div class="text-caption text-grey-7 q-mb-xs">
        {{ t('effort.label') }}
      </div>
      <q-btn-toggle
        v-model="effort"
        class="full-width compact-toggle"
        spread
        no-caps
        rounded
        unelevated
        toggle-color="primary"
        :options="effortOptions"
      />
      <div
        v-if="!compact"
        class="text-caption text-grey-7 q-mt-xs"
      >
        {{ t(`effort.hint.${effort}`) }}
      </div>
    </div>

    <div class="count-row row items-center justify-between no-wrap">
      <div>
        <div class="text-body2">{{ t('headcount.label') }}</div>
        <div
          v-if="!compact"
          class="text-caption text-grey-7"
        >
          {{ t('headcount.hint') }}
        </div>
      </div>
      <chore-count-stepper
        v-model="headcount"
        :label="t('headcount.label')"
      />
    </div>

    <div class="count-row row items-center justify-between no-wrap">
      <div>
        <div class="text-body2">{{ t('supervisorCount.label') }}</div>
        <div
          v-if="!compact"
          class="text-caption text-grey-7"
        >
          {{ t('supervisorCount.hint') }}
        </div>
      </div>
      <chore-count-stepper
        v-model="supervisorCount"
        :label="t('supervisorCount.label')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ChoreEffort } from '@camp-registration/common/entities';
import ChoreCountStepper from '@/features/chores/components/ChoreCountStepper.vue';

defineProps<{
  // Slots repeat these for each time; the explanations would only repeat too.
  compact?: boolean;
}>();

const effort = defineModel<ChoreEffort>('effort', { required: true });
const headcount = defineModel<number>('headcount', { required: true });
const supervisorCount = defineModel<number>('supervisorCount', {
  required: true,
});

const { t } = useI18n();

const EFFORTS: ChoreEffort[] = ['LIGHT', 'NORMAL', 'HEAVY'];

const effortOptions = computed(() =>
  EFFORTS.map((value) => ({ value, label: t(`effort.option.${value}`) })),
);
</script>

<style scoped>
.count-row {
  gap: 12px;
}
</style>

<i18n lang="yaml" locale="en">
effort:
  label: 'Effort'
  option:
    LIGHT: 'Light'
    NORMAL: 'Normal'
    HEAVY: 'Heavy'
  hint:
    LIGHT: 'Quick and easy — like setting the tables. Counts less when sharing out duties fairly.'
    NORMAL: 'A regular duty.'
    HEAVY: 'Long or unpleasant — like dinner dishes or cleaning toilets. Counts more when sharing out duties fairly.'
headcount:
  label: 'People needed'
  hint: 'Used to fill the duty automatically.'
supervisorCount:
  label: 'Supervisors needed'
  hint: 'Staff who keep an eye on it. 0 = none.'
</i18n>

<i18n lang="yaml" locale="de">
effort:
  label: 'Aufwand'
  option:
    LIGHT: 'Leicht'
    NORMAL: 'Normal'
    HEAVY: 'Schwer'
  hint:
    LIGHT: 'Schnell und einfach — z. B. Tische decken. Zählt bei der fairen Verteilung weniger.'
    NORMAL: 'Ein normaler Dienst.'
    HEAVY: 'Lang oder unbeliebt — z. B. Abwasch nach dem Abendessen oder Toiletten putzen. Zählt bei der fairen Verteilung mehr.'
headcount:
  label: 'Benötigte Personen'
  hint: 'Wird zum automatischen Besetzen verwendet.'
supervisorCount:
  label: 'Benötigte Aufsichten'
  hint: 'Betreuende, die ein Auge darauf haben. 0 = keine.'
</i18n>

<i18n lang="yaml" locale="fr">
effort:
  label: 'Effort'
  option:
    LIGHT: 'Léger'
    NORMAL: 'Normal'
    HEAVY: 'Lourd'
  hint:
    LIGHT: 'Rapide et facile — comme mettre la table. Compte moins dans la répartition équitable.'
    NORMAL: 'Une corvée normale.'
    HEAVY: 'Longue ou désagréable — comme la vaisselle du dîner ou le nettoyage des toilettes. Compte plus dans la répartition équitable.'
headcount:
  label: 'Personnes nécessaires'
  hint: 'Utilisé pour remplir la corvée automatiquement.'
supervisorCount:
  label: 'Encadrants nécessaires'
  hint: 'Membres de l’encadrement qui surveillent. 0 = aucun.'
</i18n>

<i18n lang="yaml" locale="pl">
effort:
  label: 'Wysiłek'
  option:
    LIGHT: 'Lekki'
    NORMAL: 'Normalny'
    HEAVY: 'Ciężki'
  hint:
    LIGHT: 'Szybko i łatwo — np. nakrywanie do stołu. Liczy się mniej przy sprawiedliwym podziale.'
    NORMAL: 'Zwykły dyżur.'
    HEAVY: 'Długi lub nieprzyjemny — np. zmywanie po kolacji lub sprzątanie toalet. Liczy się bardziej przy sprawiedliwym podziale.'
headcount:
  label: 'Potrzebne osoby'
  hint: 'Używane do automatycznego obsadzania.'
supervisorCount:
  label: 'Potrzebni opiekunowie'
  hint: 'Kadra, która pilnuje. 0 = brak.'
</i18n>

<i18n lang="yaml" locale="cs">
effort:
  label: 'Náročnost'
  option:
    LIGHT: 'Lehká'
    NORMAL: 'Běžná'
    HEAVY: 'Těžká'
  hint:
    LIGHT: 'Rychlé a snadné — např. prostírání stolů. Při spravedlivém rozdělení se počítá méně.'
    NORMAL: 'Běžná služba.'
    HEAVY: 'Dlouhá nebo nepříjemná — např. mytí nádobí po večeři nebo úklid toalet. Při spravedlivém rozdělení se počítá více.'
headcount:
  label: 'Potřebný počet lidí'
  hint: 'Používá se k automatickému obsazení.'
supervisorCount:
  label: 'Potřebný dozor'
  hint: 'Vedoucí, kteří dohlížejí. 0 = žádný.'
</i18n>
