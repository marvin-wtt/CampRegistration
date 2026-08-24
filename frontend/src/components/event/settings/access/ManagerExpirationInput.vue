<template>
  <!-- No gutter class: nested gutters would indent this block past the
       sibling fields of the surrounding form. -->
  <div class="column">
    <q-select
      v-model="preset"
      :label="t('label')"
      :options="options"
      :hint="hint"
      map-options
      emit-value
      rounded
      outlined
    />

    <date-time-input
      v-if="preset === 'custom'"
      v-model="custom"
      :label="t('custom.label')"
      :rules="[(val?: string) => !!val || t('custom.rule.required')]"
      hide-bottom-space
      outlined
      rounded
      class="q-mt-sm"
    />
  </div>
</template>

<script lang="ts" setup>
import type { QSelectOption } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, ref, watch } from 'vue';
import DateTimeInput from '@/components/common/inputs/DateTimeInput.vue';

const { t, d } = useI18n();

const { eventEndAt } = defineProps<{
  eventEndAt: string | undefined;
}>();

// `undefined` means the caller has no value yet, so the default applies.
const modelValue = defineModel<string | null | undefined>({ required: true });

/** Days after the event's last day, in the order the options are listed. */
const PRESET_OFFSETS = {
  eventEnd: 0,
  day: 1,
  week: 7,
  month: 30,
  quarter: 90,
} as const;

type Offset = keyof typeof PRESET_OFFSETS;
type Preset = Offset | 'never' | 'custom';

const PREFERRED_OFFSET: Offset = 'week';

const eventEnd = computed<Date | null>(() => {
  const date = new Date(eventEndAt ?? '');
  if (isNaN(date.getTime())) {
    return null;
  }

  // Whole seconds: the column stores no milliseconds.
  date.setHours(23, 59, 59, 0);

  return date;
});

/** Offsets that already passed would grant no access at all. */
const availableOffsets = computed<Offset[]>(() => {
  const now = new Date();

  return (Object.keys(PRESET_OFFSETS) as Offset[]).filter((offset) => {
    const date = offsetDate(offset);
    return date !== null && date > now;
  });
});

const options = computed<QSelectOption<Preset>[]>(() => {
  const presets: Preset[] = [...availableOffsets.value, 'never', 'custom'];

  return presets.map((preset) => ({
    label: t('option.' + preset),
    value: preset,
  }));
});

const preset = ref<Preset>(detectPreset(modelValue.value));
const custom = ref<string | null | undefined>(
  preset.value === 'custom' ? modelValue.value : null,
);

const hint = computed<string>(() => {
  return modelValue.value
    ? t('hint.until', { date: d(modelValue.value, 'dateTime') })
    : t('hint.never');
});

// Switching to a custom date starts from the previously selected one.
watch(preset, (value, previous) => {
  if (value !== 'custom' || custom.value) {
    return;
  }

  custom.value =
    previous === 'never' || previous === 'custom'
      ? null
      : (offsetDate(previous)?.toISOString() ?? null);
});

watch(
  [preset, custom],
  () => {
    modelValue.value = resolveValue();
  },
  { immediate: true },
);

function offsetDate(offset: Offset): Date | null {
  if (eventEnd.value === null) {
    return null;
  }

  const date = new Date(eventEnd.value);
  date.setDate(date.getDate() + PRESET_OFFSETS[offset]);

  return date;
}

function detectPreset(value: string | null | undefined): Preset {
  if (value === undefined) {
    const available = availableOffsets.value;
    return available.includes(PREFERRED_OFFSET)
      ? PREFERRED_OFFSET
      : (available[0] ?? 'never');
  }

  if (value === null) {
    return 'never';
  }

  // Stored values are rounded to whole seconds and the presets lie days
  // apart, so recognise a preset within a minute of the stored date.
  const time = new Date(value).getTime();
  const match = availableOffsets.value.find((offset) => {
    const date = offsetDate(offset);
    return date !== null && Math.abs(date.getTime() - time) < 60_000;
  });

  return match ?? 'custom';
}

function resolveValue(): string | null {
  if (preset.value === 'never') {
    return null;
  }

  if (preset.value === 'custom') {
    return custom.value ?? null;
  }

  return offsetDate(preset.value)?.toISOString() ?? null;
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
label: 'Access expires'

option:
  eventEnd: 'When the event ends'
  day: '1 day after the event ends'
  week: '1 week after the event ends'
  month: '1 month after the event ends'
  quarter: '3 months after the event ends'
  never: 'Never'
  custom: 'Custom date…'

hint:
  until: 'Access ends on {date}'
  never: 'Access does not expire'

custom:
  label: 'Expiration date'
  rule:
    required: 'The expiration date is required'
</i18n>

<i18n lang="yaml" locale="de">
label: 'Zugriff läuft ab'

option:
  eventEnd: 'Mit dem Ende der Veranstaltung'
  day: '1 Tag nach Veranstaltungsende'
  week: '1 Woche nach Veranstaltungsende'
  month: '1 Monat nach Veranstaltungsende'
  quarter: '3 Monate nach Veranstaltungsende'
  never: 'Nie'
  custom: 'Eigenes Datum …'

hint:
  until: 'Zugriff endet am {date}'
  never: 'Zugriff läuft nicht ab'

custom:
  label: 'Ablaufdatum'
  rule:
    required: 'Das Ablaufdatum ist erforderlich'
</i18n>

<i18n lang="yaml" locale="fr">
label: 'L’accès expire'

option:
  eventEnd: "À la fin de l'événement"

  day: "1 jour après la fin de l'événement"

  week: "1 semaine après la fin de l'événement"

  month: "1 mois après la fin de l'événement"

  quarter: "3 mois après la fin de l'événement"

  never: 'Jamais'
  custom: 'Date personnalisée…'

hint:
  until: 'L’accès prend fin le {date}'
  never: 'L’accès n’expire pas'

custom:
  label: 'Date d’expiration'
  rule:
    required: 'La date d’expiration est requise'
</i18n>

<i18n lang="yaml" locale="pl">
label: 'Dostęp wygasa'

option:
  eventEnd: 'Wraz z końcem wydarzenia'
  day: '1 dzień po zakończeniu wydarzenia'
  week: '1 tydzień po zakończeniu wydarzenia'
  month: '1 miesiąc po zakończeniu wydarzenia'
  quarter: '3 miesiące po zakończeniu wydarzenia'
  never: 'Nigdy'
  custom: 'Własna data…'

hint:
  until: 'Dostęp kończy się {date}'
  never: 'Dostęp nie wygasa'

custom:
  label: 'Data wygaśnięcia'
  rule:
    required: 'Data wygaśnięcia jest wymagana'
</i18n>

<i18n lang="yaml" locale="cs">
label: 'Přístup vyprší'

option:
  eventEnd: 'S koncem akce'
  day: '1 den po skončení akce'
  week: '1 týden po skončení akce'
  month: '1 měsíc po skončení akce'
  quarter: '3 měsíce po skončení akce'
  never: 'Nikdy'
  custom: 'Vlastní datum…'

hint:
  until: 'Přístup končí {date}'
  never: 'Přístup nevyprší'

custom:
  label: 'Datum vypršení platnosti'
  rule:
    required: 'Datum vypršení platnosti je povinné'
</i18n>
