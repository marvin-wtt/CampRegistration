<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <chore-dialog-card
      ref="card"
      :title="title"
      :subtitle="t('subtitle')"
      :width="440"
      @cancel="onDialogCancel"
    >
      <template #pinned>
        <q-input
          v-model="search"
          :placeholder="t('search')"
          clearable
          dense
          outlined
          rounded
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <div
        v-if="loading"
        class="column no-wrap q-gutter-y-xs"
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
        class="text-body2 text-grey-7 q-py-md text-center"
      >
        {{ t('empty') }}
      </div>

      <q-list
        v-else
        separator
        bordered
        class="rounded-lg overflow-hidden"
      >
        <q-item
          v-for="row in rows"
          :key="row.id"
          clickable
          @click="onDialogOK(row.id)"
        >
          <q-item-section>
            <q-item-label>{{ row.name }}</q-item-label>
            <q-item-label caption>{{ row.hint }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </chore-dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDialogPluginComponent } from 'quasar';
import type {
  ChoreAssignment,
  ChoreAssignmentSuggestionCandidate,
  ChoreMemberRole,
} from '@camp-registration/common/entities';
import { useChoreAssignmentStore } from '@/features/chores/stores/chore-assignment-store';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import ChoreDialogCard from '@/features/chores/components/ChoreDialogCard.vue';

// Picks one person for a duty — to replace someone, or to add them —
// fairest first, from the same ranking as everywhere else.
const props = defineProps<{
  assignment: ChoreAssignment;
  role: ChoreMemberRole;
  names: Map<string, string>;
  // Whose place is being filled, if any.
  replacing?: string | undefined;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const choreAssignmentStore = useChoreAssignmentStore();

const candidates = ref<ChoreAssignmentSuggestionCandidate[]>([]);
const loading = ref<boolean>(true);
const search = ref<string | null>('');
const card = useTemplateRef<{ scrollToTop: () => void }>('card');

// A narrower search shouldn't leave the list scrolled past its results.
watch(search, () => card.value?.scrollToTop());

const title = computed<string>(() =>
  props.replacing
    ? t('title.replace', { name: props.names.get(props.replacing) ?? '' })
    : t('title.add'),
);

async function load() {
  try {
    const result = await choreAssignmentStore.fetchSuggestions({
      choreId: props.assignment.choreId,
      unit: 'PERSON',
      role: props.role,
      date: props.assignment.date,
      assignmentId: props.assignment.id,
    });
    candidates.value = result?.candidates ?? [];
  } finally {
    loading.value = false;
  }
}
void load();

const onDuty = computed<Set<string>>(
  () => new Set(props.assignment.members.map((m) => m.registrationId)),
);

const rows = computed(() => {
  const needle = (search.value ?? '').trim().toLowerCase();
  return candidates.value
    .filter((candidate) => !onDuty.value.has(candidate.id))
    .map((candidate) => ({
      id: candidate.id,
      name: props.names.get(candidate.id) ?? '?',
      hint: [
        t(`balance.${candidate.balance}`),
        candidate.busy ? t('busy') : undefined,
      ]
        .filter(Boolean)
        .join(' · '),
    }))
    .filter((row) => !needle || row.name.toLowerCase().includes(needle));
});
</script>

<i18n lang="yaml" locale="en">
title:
  replace: 'Replace {name}'
  add: 'Add person'
subtitle: 'Fairest first.'
search: 'Search'
empty: 'No one found.'
busy: 'already on a duty that day'
balance:
  BELOW: 'Less than average so far'
  AVERAGE: 'About average so far'
  ABOVE: 'More than average so far'
</i18n>

<i18n lang="yaml" locale="de">
title:
  replace: '{name} ersetzen'
  add: 'Person hinzufügen'
subtitle: 'Die fairste Wahl zuerst.'
search: 'Suchen'
empty: 'Niemand gefunden.'
busy: 'an dem Tag schon im Dienst'
balance:
  BELOW: 'Bisher weniger als der Durchschnitt'
  AVERAGE: 'Bisher etwa Durchschnitt'
  ABOVE: 'Bisher mehr als der Durchschnitt'
</i18n>

<i18n lang="yaml" locale="fr">
title:
  replace: 'Remplacer {name}'
  add: 'Ajouter une personne'
subtitle: 'Le choix le plus équitable d’abord.'
search: 'Rechercher'
empty: 'Personne trouvé.'
busy: 'déjà de corvée ce jour-là'
balance:
  BELOW: 'Moins que la moyenne jusqu’ici'
  AVERAGE: 'Dans la moyenne jusqu’ici'
  ABOVE: 'Plus que la moyenne jusqu’ici'
</i18n>

<i18n lang="yaml" locale="pl">
title:
  replace: 'Zastąp: {name}'
  add: 'Dodaj osobę'
subtitle: 'Najsprawiedliwszy wybór najpierw.'
search: 'Szukaj'
empty: 'Nikogo nie znaleziono.'
busy: 'ma już dyżur tego dnia'
balance:
  BELOW: 'Dotąd mniej niż średnio'
  AVERAGE: 'Dotąd około średniej'
  ABOVE: 'Dotąd więcej niż średnio'
</i18n>

<i18n lang="yaml" locale="cs">
title:
  replace: 'Nahradit: {name}'
  add: 'Přidat osobu'
subtitle: 'Nejspravedlivější volba jako první.'
search: 'Hledat'
empty: 'Nikdo nenalezen.'
busy: 'ten den už má službu'
balance:
  BELOW: 'Zatím méně než průměr'
  AVERAGE: 'Zatím zhruba průměr'
  ABOVE: 'Zatím více než průměr'
</i18n>
