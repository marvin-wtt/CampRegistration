<template>
  <q-input
    v-model="inputValue"
    hide-bottom-space
    outlined
    rounded
    v-bind="$attrs"
    @focus="($refs.popup as QPopupProxy).show()"
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
                v-model="singleDay"
                :label="t('field.singleDay')"
              />
              <q-btn
                v-close-popup
                color="primary"
                flat
                :label="t('actions.ok')"
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
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QInputSlots, QPopupProxy } from 'quasar';

const { t } = useI18n();

type RangeDate = { from?: string | undefined; to?: string | undefined };

const { defaultStartHour = 9, defaultEndHour = 18 } = defineProps<{
  defaultStartHour?: number | undefined;
  defaultEndHour?: number | undefined;
}>();

const model = defineModel<RangeDate | string | undefined>({
  get: () => {
    if (singleDay.value) {
      return isoToDate(from.value) ?? isoToDate(to.value);
    }
    return {
      from: isoToDate(from.value),
      to: isoToDate(to.value),
    };
  },
  set: (val) => {
    // QDate emits a plain date string instead of {from, to} when a range
    // selection starts and ends on the same day.
    const range = typeof val === 'string' ? { from: val, to: val } : val;
    applyRange(range);
  },
});

const from = defineModel<string | undefined>('from');
const to = defineModel<string | undefined>('to');

// Range-mode QDate can't visually highlight/label a same-day selection
// (its internal rangeModel only recognizes from.dateHash < to.dateHash), so
// single-day dates are picked with QDate's range mode turned off instead.
const singleDay = ref(false);
let singleDayInitialized = false;
watch(
  [from, to],
  ([f, t]) => {
    if (singleDayInitialized || !f || !t) {
      return;
    }
    singleDay.value = isoToDate(f) === isoToDate(t);
    singleDayInitialized = true;
  },
  { immediate: true },
);

function applyRange(range?: RangeDate): void {
  to.value = combineDateWithTime(range?.to, to.value, defaultEndHour);
  from.value = combineDateWithTime(range?.from, from.value, defaultStartHour);
}

const inputValue = computed<string | undefined>({
  get: () => {
    if (!from.value || !to.value) {
      return undefined;
    }

    const fromDate = isoToDate(from.value);
    const toDate = isoToDate(to.value);

    return fromDate === toDate ? fromDate : `${fromDate} - ${toDate}`;
  },
  set: (val) => {
    const dates = val?.split('-');
    if (!dates || dates.length !== 2) {
      return;
    }

    applyRange({ from: dates[0]!, to: dates[1]! });
  },
});

function isoToDate(utcString?: string): string | undefined {
  if (!utcString) {
    return undefined;
  }

  const date = new Date(utcString);

  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function combineDateWithTime(
  date?: string,
  time?: string,
  defaultHours = 0,
): string | undefined {
  if (!date) {
    return undefined;
  }

  const combinedDateTime = new Date();
  if (time) {
    const timeDate = new Date(time);
    combinedDateTime.setUTCHours(
      timeDate.getUTCHours(),
      timeDate.getUTCMinutes(),
      0,
      0,
    );
  } else {
    combinedDateTime.setHours(defaultHours, 0, 0, 0);
  }

  const dateParts = date.split('-');
  combinedDateTime.setFullYear(parseInt(dateParts[0] ?? ''));
  combinedDateTime.setMonth(parseInt(dateParts[1] ?? '') - 1);
  combinedDateTime.setDate(parseInt(dateParts[2] ?? ''));

  return combinedDateTime.toISOString();
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
