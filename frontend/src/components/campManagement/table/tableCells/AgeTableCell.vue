<template>
  <span class="age-cell">
    {{ age }}

    <!-- Cake icon sits next to the number so it stays visible in wide columns -->
    <q-icon
      v-if="hasBirthDay && showBirthday"
      class="age-cell__cake"
      color="red"
      name="cake"
    />

    <q-tooltip>
      {{ birthday }}
    </q-tooltip>
  </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import type { AgeOptions } from 'components/campManagement/table/tableCells/AgeOptions';

const { d } = useI18n();

const {
  props: cellProps,
  camp,
  options,
} = defineProps<TableCellProps<AgeOptions>>();

const showBirthday = computed<boolean>(() => {
  return options?.showBirthday ?? true;
});

const startAt = computed<Date>(() => {
  return new Date(camp.startAt);
});

const endAt = computed<Date>(() => {
  return new Date(camp.endAt);
});

const hasBirthDay = computed<boolean>(() => {
  const value = cellProps.value;
  if (typeof value !== 'string') {
    return false;
  }
  const birthday = new Date(value);

  return isBirthdayInRange(birthday, startAt.value, endAt.value);
});

const birthday = computed<string>(() => {
  const value = cellProps.value;

  if (typeof value !== 'string') {
    return 'Invalid';
  }

  return d(value);
});

const age = computed<string>(() => {
  const value = cellProps.value;
  if (typeof value !== 'string') {
    return 'Invalid';
  }

  const months = startAt.value.getTime() - new Date(value).getTime();
  const years = new Date(months);

  return Math.abs(years.getUTCFullYear() - 1970).toString();
});

function isBirthdayInRange(
  birthDate: Date,
  startDate: Date,
  endDate: Date,
): boolean {
  // Extract the month and day from the birthdate
  const birthMonth = birthDate.getMonth();
  const birthDay = birthDate.getDate();

  // Create date objects for the start and end of the range for comparison
  const startMonth = startDate.getMonth();
  const startDay = startDate.getDate();
  const endMonth = endDate.getMonth();
  const endDay = endDate.getDate();

  // Check if the birthday falls within the range
  if (startDate <= endDate) {
    // Normal case: range does not span a year
    return (
      (birthMonth > startMonth ||
        (birthMonth === startMonth && birthDay >= startDay)) &&
      (birthMonth < endMonth || (birthMonth === endMonth && birthDay <= endDay))
    );
  } else {
    // Year break case: range spans from the end of one year to the beginning of the next
    return (
      birthMonth > startMonth ||
      (birthMonth === startMonth && birthDay >= startDay) ||
      birthMonth < endMonth ||
      (birthMonth === endMonth && birthDay <= endDay)
    );
  }
}
</script>

<style scoped lang="scss">
.age-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &__cake {
    font-size: 1.1em;
  }
}
</style>
