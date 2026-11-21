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
        <div class="column interval-field">
          <span class="text-label-large text-on-surface-variant">
            {{ t('interval.label') }}
          </span>
          <div class="row interval-buttons">
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
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import {
  MAX_RETENTION_POSTPONE_MONTHS,
  type RetentionPostponeData,
} from '@camp-registration/common/privacy';
import { addToDate } from '@camp-registration/common/utils';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DateInput from '@/components/common/inputs/DateInput.vue';

const { current, min, max } = defineProps<{
  /** `YYYY-MM-DD`: the deadline in force. */
  current: string;
  /** `YYYY-MM-DD`: the dates the server accepts, as it sent them. */
  min: string;
  max: string;
}>();

/** Shortcuts, counted from the deadline in force. */
const INTERVALS = [1, 3, 6, 12] as const;

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const { t } = useI18n();

const shifted = (months: number) => addToDate(current, { months });

const within = (date: string) => date >= min && date <= max;

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
/* Gaps, not q-gutter: its negative margin is clipped by the scroll body. */
.postpone-body {
  gap: 16px;
}

.interval-field {
  gap: 8px;
}

.interval-buttons {
  gap: 8px;
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
