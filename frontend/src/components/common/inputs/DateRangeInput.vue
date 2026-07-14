<template>
  <q-input
    :model-value="displayValue"
    hide-bottom-space
    outlined
    rounded
    readonly
    v-bind="attrs"
    @focus="popup?.show()"
  >
    <template #append>
      <q-icon
        class="cursor-pointer"
        name="event"
      >
        <q-popup-proxy
          ref="popup"
          transition-hide="scale"
          transition-show="scale"
          cover
        >
          <q-date
            v-model="model"
            mask="YYYY-MM-DD"
            :range="!singleDay"
          >
            <div class="row items-center justify-between">
              <q-toggle
                :model-value="singleDay"
                :label="t('field.singleDay')"
                @update:model-value="onSingleDayToggle"
              />
              <q-btn
                v-close-popup
                :label="t('actions.ok')"
                color="primary"
                flat
              />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>

    <!-- Parent slots -->
    <template
      v-for="(data, name, index) in $slots as unknown as QInputSlots"
      :key="index"
      #[name]
    >
      <slot
        :name="name"
        v-bind="data"
      />
    </template>
  </q-input>
</template>

<script lang="ts" setup>
import { computed, ref, useAttrs, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { date as dateUtil, type QInputSlots, type QPopupProxy } from 'quasar';

const { t } = useI18n();
const attrs = useAttrs();

type DateRange = { from?: string | undefined; to?: string | undefined };

const { defaultStartTime = '09:00', defaultEndTime = '18:00' } = defineProps<{
  // Time of day (HH:mm, local) applied when a date is set without an
  // existing time to preserve
  defaultStartTime?: string | undefined;
  defaultEndTime?: string | undefined;
}>();

// QDate rejects a plain date string in range mode and a {from, to} object in
// single mode, so the model shape must follow the singleDay toggle.
const model = defineModel<DateRange | string | undefined>({
  get: () =>
    singleDay.value
      ? (toDay(from.value) ?? toDay(to.value))
      : { from: toDay(from.value), to: toDay(to.value) },
  set: (value) => {
    // QDate emits a plain date string in single-day mode, and also in range
    // mode when the selection starts and ends on the same day.
    applyRange(typeof value === 'string' ? { from: value, to: value } : value);
  },
});

const from = defineModel<string | undefined>('from');
const to = defineModel<string | undefined>('to');

const popup = useTemplateRef<QPopupProxy>('popup');

const singleDay = ref<boolean>(isSingleDay());

watch([from, to], () => {
  singleDay.value = isSingleDay();
});

const displayValue = computed<string | undefined>(() => {
  const fromDay = toDay(from.value);
  const toDayStr = toDay(to.value);

  if (!fromDay || !toDayStr) {
    return undefined;
  }

  return fromDay === toDayStr ? fromDay : `${fromDay} - ${toDayStr}`;
});

function isSingleDay(): boolean {
  return !!from.value && toDay(from.value) === toDay(to.value);
}

function onSingleDayToggle(value: boolean): void {
  singleDay.value = value;

  if (value) {
    const day = toDay(from.value) ?? toDay(to.value);
    if (day) {
      applyRange({ from: day, to: day });
    }
  }
}

function applyRange(range?: DateRange): void {
  from.value = toIso(range?.from, from.value, defaultStartTime);
  to.value = toIso(range?.to, to.value, defaultEndTime);
}

function toDay(iso?: string): string | undefined {
  return iso ? dateUtil.formatDate(new Date(iso), 'YYYY-MM-DD') : undefined;
}

function toIso(
  day: string | undefined,
  currentIso: string | undefined,
  defaultTime: string,
): string | undefined {
  if (!day) {
    return undefined;
  }

  const [year = 0, month = 1, dayOfMonth = 1] = day.split('-').map(Number);

  // Keep the existing time of day; fall back to the default time when the
  // date is set for the first time.
  if (currentIso) {
    const result = new Date(currentIso);
    result.setFullYear(year, month - 1, dayOfMonth);
    return result.toISOString();
  }

  const [hours = 0, minutes = 0] = defaultTime.split(':').map(Number);
  return new Date(year, month - 1, dayOfMonth, hours, minutes).toISOString();
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
actions:
  ok: 'Ok'
field:
  singleDay: 'Single day'
</i18n>

<i18n lang="yaml" locale="de">
actions:
  ok: 'Ok'
field:
  singleDay: 'Eintägig'
</i18n>

<i18n lang="yaml" locale="fr">
actions:
  ok: 'Ok'
field:
  singleDay: 'Un seul jour'
</i18n>

<i18n lang="yaml" locale="pl">
actions:
  ok: 'Ok'
field:
  singleDay: 'Jeden dzień'
</i18n>

<i18n lang="yaml" locale="cs">
actions:
  ok: 'Ok'
field:
  singleDay: 'Jeden den'
</i18n>
