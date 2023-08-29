<template>
  <q-input
    v-model="inputValue"
    hide-bottom-space
    outlined
    rounded
    v-bind="$attrs"
    @focus="$refs.popup.show()"
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
            v-model="modelValue"
            mask="YYYY-MM-DD"
            range
          >
            <div class="row items-center justify-end">
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
      v-for="(data, name, index) in $slots"
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
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

type RangeDate = { from?: string; to?: string };

interface Props {
  modelValue?: RangeDate;
  from?: string;
  to?: string;
  rangeFrom?: string;
  rangeTo?: string;
}

const props = defineProps<Props>();

const from = computed<string | undefined>(() => {
  return props.modelValue?.from ?? props.from;
});

const to = computed<string | undefined>(() => {
  return props.modelValue?.to ?? props.to;
});

const emit = defineEmits<{
  (e: 'update:modelValue', value?: RangeDate): void;
  (e: 'update:to', value?: string): void;
  (e: 'update:from', value?: string): void;
}>();

const modelValue = computed<RangeDate | undefined>({
  get: () => {
    return {
      from: utcToDate(props.from),
      to: utcToDate(props.to),
    };
  },
  set: (val) => {
    emit('update:modelValue', val);
    emit('update:to', combineDateWithTime(val?.to, to.value));
    emit('update:from', combineDateWithTime(val?.from, from.value));
  },
});

const inputValue = computed<string | undefined>({
  get: () => {
    if (!from.value || !to.value) {
      return undefined;
    }

    return `${utcToDate(from.value)} - ${utcToDate(to.value)}`;
  },
  set: (val) => {
    const dates = val?.split('-');
    if (dates.length != 2) {
      return;
    }

    modelValue.value.from = dates[0];
    modelValue.value.to = dates[1];
  },
});

function utcToDate(utcString?: string): string | undefined {
  if (!utcString) {
    return undefined;
  }

  const date = new Date(utcString);

  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function combineDateWithTime(date?: string, time?: string): string | undefined {
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
      0
    );
  } else {
    combinedDateTime.setHours(0, 0, 0, 0);
  }

  const dateParts = date.split('-');
  combinedDateTime.setFullYear(parseInt(dateParts[0]));
  combinedDateTime.setMonth(parseInt(dateParts[1]) - 1);
  combinedDateTime.setDate(parseInt(dateParts[2]));

  return combinedDateTime.toISOString();
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
actions:
  ok: Ok
</i18n>

<i18n lang="yaml" locale="en">
actions:
  ok: Ok
</i18n>

<i18n lang="yaml" locale="en">
actions:
  ok: Ok
</i18n>
