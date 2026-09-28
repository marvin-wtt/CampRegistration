<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <chore-dialog-card
      :title="t('title')"
      :width="400"
      @submit="onDialogOK(selected === ALL ? weeks : [selected])"
      @cancel="onDialogCancel"
    >
      <q-option-group
        v-model="selected"
        :options="options"
        type="radio"
      />

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
          icon="print"
          :label="t('action.print')"
        />
      </template>
    </chore-dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDialogPluginComponent } from 'quasar';
import { addDays, parseLocalDate } from '@/utils/date';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import ChoreDialogCard from '@/features/chores/components/ChoreDialogCard.vue';

// Which weeks to print, by their Mondays; resolves to the chosen ones.
const props = defineProps<{
  weeks: string[];
  current: string;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { t, d } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const ALL = 'all';
const selected = ref<string>(props.current);

const options = computed(() => [
  ...props.weeks.map((week) => ({
    value: week,
    label: `${d(parseLocalDate(week), 'date')} – ${d(parseLocalDate(addDays(week, 6)), 'date')}`,
  })),
  { value: ALL, label: t('all', props.weeks.length) },
]);
</script>

<i18n lang="yaml" locale="en">
title: 'Print duty roster'
all: 'Whole event (1 page) | Whole event ({n} pages)'
action:
  cancel: 'Cancel'
  print: 'Print'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Dienstplan drucken'
all: 'Ganze Veranstaltung (1 Seite) | Ganze Veranstaltung ({n} Seiten)'
action:
  cancel: 'Abbrechen'
  print: 'Drucken'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Imprimer le planning des corvées'
all: 'Tout l’événement (1 page) | Tout l’événement ({n} pages)'
action:
  cancel: 'Annuler'
  print: 'Imprimer'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Drukuj grafik dyżurów'
all: 'Całe wydarzenie (1 strona) | Całe wydarzenie ({n} stron)'
action:
  cancel: 'Anuluj'
  print: 'Drukuj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Vytisknout rozpis služeb'
all: 'Celá akce (1 strana) | Celá akce ({n} stran)'
action:
  cancel: 'Zrušit'
  print: 'Tisk'
</i18n>
