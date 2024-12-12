<template>
  <span>
    {{ age }}

    <q-tooltip>
      {{ birthday }}
    </q-tooltip>
  </span>

  <!-- Special badge if birthday during time period -->
  <q-badge
    v-if="hasBirthDay"
    color="transparent"
    floating
  >
    <q-icon
      color="red"
      name="cake"
    />
  </q-badge>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';

const props = defineProps<TableCellProps>();
const { d } = useI18n();

const startAt = computed<Date>(() => {
  return new Date(props.camp.startAt);
});

const endAt = computed<Date>(() => {
  return new Date(props.camp.endAt);
});

const hasBirthDay = computed<boolean>(() => {
  const value = props.props.value;
  if (typeof value !== 'string') {
    return false;
  }
  const birthday = new Date(value);

  return isBirthdayInRange(birthday, startAt.value, endAt.value);
});

const birthday = computed<string>(() => {
  const value = props.props.value;

  if (typeof value !== 'string') {
    return 'Invalid';
  }

  return d(value);
});

const age = computed<string>(() => {
  const value = props.props.value;
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

<style scoped></style>
