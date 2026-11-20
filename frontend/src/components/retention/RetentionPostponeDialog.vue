<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('title')"
      icon="event_repeat"
      :width="520"
      @submit="onSubmit"
      @cancel="onDialogCancel"
    >
      <div class="column postpone-body">
        <p class="text-body2 text-on-surface-variant q-my-none">
          {{ t('hint') }}
        </p>
        <div class="column q-gap-xs">
          <span class="text-label-large text-on-surface-variant">
            {{ t('interval.label') }}
          </span>
          <div class="row q-gap-sm">
            <m-btn
              v-for="months in INTERVALS"
              :key="months"
              :label="t(`interval.m${months}`)"
              :disable="!within(shifted(months))"
              :tonal="until !== shifted(months)"
              :data-test="`postpone-interval-${months}`"
              secondary
              rounded
              no-caps
              @click="until = shifted(months)"
            />
          </div>
        </div>
        <date-input
          v-model="until"
          :label="t('field.until')"
          :hint="
            t('field.untilHint', { months: MAX_RETENTION_POSTPONE_MONTHS })
          "
          :min
          :max
          outlined
          rounded
        />
        <q-input
          v-model="reason"
          type="textarea"
          :label="t('field.reason')"
          :hint="t('field.reasonHint')"
          :rules="[(value: string) => !!value.trim() || t('field.required')]"
          autogrow
          outlined
          rounded
          maxlength="2000"
        />
      </div>

      <template #actions>
        <m-btn
          type="reset"
          primary
          text
          :label="t('action.cancel')"
        />
        <m-btn
          type="submit"
          primary
          :disable="!until || !reason.trim()"
          :label="t('action.postpone')"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import {
  MAX_RETENTION_POSTPONE_MONTHS,
  type RetentionPostponeData,
} from '@camp-registration/common/privacy';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DateInput from '@/components/common/inputs/DateInput.vue';

const props = defineProps<{
  /** The deadline in force (ISO): a postponement only moves it later. */
  current: string;
  /** `YYYY-MM-DD`: the sensitive deadline may not move past the general one. */
  latest?: string | null;
}>();

/** Shortcuts, counted from the deadline in force. */
const INTERVALS = [1, 3, 6, 12] as const;

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The calendar day of `current`, moved by whole months or days, in UTC. */
function fromCurrent({ months = 0, days = 0 }): string {
  const date = new Date(`${props.current.slice(0, 10)}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months, date.getUTCDate() + days);
  return isoDate(date);
}

const shifted = (months: number) => fromCurrent({ months });

// The day after both today and the deadline in force.
const min = computed(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const afterCurrent = fromCurrent({ days: 1 });
  const afterToday = isoDate(tomorrow);
  return afterCurrent > afterToday ? afterCurrent : afterToday;
});

const within = (date: string) => date >= min.value && date <= max.value;

const max = computed(() => {
  const limit = new Date();
  limit.setMonth(limit.getMonth() + MAX_RETENTION_POSTPONE_MONTHS);
  const latest = isoDate(limit);
  return props.latest && props.latest < latest ? props.latest : latest;
});

const until = ref<string | null>(null);
const reason = ref('');

function onSubmit() {
  if (!until.value || !reason.value.trim()) {
    return;
  }
  onDialogOK({
    until: until.value,
    reason: reason.value.trim(),
  } satisfies RetentionPostponeData);
}
</script>

<style scoped>
.postpone-body {
  /* A gap, not q-gutter: its negative margin is clipped by the scroll body. */
  gap: 16px;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Postpone deletion'
hint: 'Only postpone when something has to be kept for longer, such as an open insurance claim or a legal obligation. The deadline is then reminded about again.'
interval:
  label: 'Postpone by'
  m1: '1 month'
  m3: '3 months'
  m6: '6 months'
  m12: '12 months'
field:
  until: 'New deadline'
  untilHint: 'At most {months} months ahead. Postpone again if needed.'
  reason: 'Reason'
  reasonHint: 'Visible to the managers who can delete registrations.'
  required: 'Please give a reason.'
action:
  cancel: 'Cancel'
  postpone: 'Postpone'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Löschung verschieben'
hint: 'Verschiebe nur, wenn etwas länger aufbewahrt werden muss, etwa wegen eines offenen Versicherungsfalls oder einer gesetzlichen Pflicht. An die neue Frist wird wieder erinnert.'
interval:
  label: 'Verschieben um'
  m1: '1 Monat'
  m3: '3 Monate'
  m6: '6 Monate'
  m12: '12 Monate'
field:
  until: 'Neue Frist'
  untilHint: 'Höchstens {months} Monate im Voraus. Bei Bedarf erneut verschieben.'
  reason: 'Begründung'
  reasonHint: 'Sichtbar für alle, die Anmeldungen löschen dürfen.'
  required: 'Bitte gib eine Begründung an.'
action:
  cancel: 'Abbrechen'
  postpone: 'Verschieben'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Reporter la suppression'
hint: 'Ne reporte que si quelque chose doit être conservé plus longtemps, par exemple un sinistre en cours ou une obligation légale. Un rappel sera envoyé pour le nouveau délai.'
interval:
  label: 'Reporter de'
  m1: '1 mois'
  m3: '3 mois'
  m6: '6 mois'
  m12: '12 mois'
field:
  until: 'Nouveau délai'
  untilHint: 'Au plus {months} mois à l’avance. Reporte à nouveau si nécessaire.'
  reason: 'Motif'
  reasonHint: 'Visible par les personnes pouvant supprimer les inscriptions.'
  required: 'Indique un motif.'
action:
  cancel: 'Annuler'
  postpone: 'Reporter'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Przesuń usunięcie'
hint: 'Przesuń tylko wtedy, gdy coś trzeba przechowywać dłużej, np. z powodu otwartej szkody ubezpieczeniowej lub obowiązku prawnego. Przypomnienie zostanie wysłane ponownie przed nowym terminem.'
interval:
  label: 'Przesuń o'
  m1: '1 miesiąc'
  m3: '3 miesiące'
  m6: '6 miesięcy'
  m12: '12 miesięcy'
field:
  until: 'Nowy termin'
  untilHint: 'Najwyżej {months} miesięcy naprzód. W razie potrzeby przesuń ponownie.'
  reason: 'Powód'
  reasonHint: 'Widoczny dla osób, które mogą usuwać zgłoszenia.'
  required: 'Podaj powód.'
action:
  cancel: 'Anuluj'
  postpone: 'Przesuń'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Odložit smazání'
hint: 'Odkládejte jen tehdy, když je třeba něco uchovat déle, například kvůli otevřené pojistné události nebo zákonné povinnosti. Na novou lhůtu bude znovu připomenuto.'
interval:
  label: 'Odložit o'
  m1: '1 měsíc'
  m3: '3 měsíce'
  m6: '6 měsíců'
  m12: '12 měsíců'
field:
  until: 'Nová lhůta'
  untilHint: 'Nejvýše {months} měsíců dopředu. V případě potřeby odložte znovu.'
  reason: 'Důvod'
  reasonHint: 'Viditelný pro ty, kdo mohou mazat přihlášky.'
  required: 'Uveďte prosím důvod.'
action:
  cancel: 'Zrušit'
  postpone: 'Odložit'
</i18n>
