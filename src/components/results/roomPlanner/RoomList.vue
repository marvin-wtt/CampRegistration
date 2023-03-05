<template>
  <q-list
    bordered
    padding
  >
    <q-item-label header>
      {{ props.name }}
    </q-item-label>

    <room-list-item
      v-for="(roomMate, index) in room.roomMates"
      :key="index"
      v-model="room.roomMates[index]"
      :options="options"
      :position="index + 1"
    />
  </q-list>
</template>

<script lang="ts" setup>
import RoomListItem from 'components/results/roomPlanner/RoomListItem.vue';
import { computed } from 'vue';

interface Room {
  name: string;
  roomMates: unknown[];
}

interface Props {
  name: string;
  modelValue: Room;
  people: unknown[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Room): void;
}>();

const room = computed<Room>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const gender = computed<string | undefined>(() => {
  let gender: string | undefined = undefined;

  room.value.roomMates.some((value) => {
    if (!hasGenderProperty(value)) {
      return false;
    }

    gender = value.gender;
    return true;
  });

  console.log(gender);

  return gender;
});

const teamer = computed<boolean | undefined>(() => {
  let teamer: boolean | undefined = undefined;

  room.value.roomMates.some((value) => {
    if (!hasTeamerProperty(value)) {
      return false;
    }

    teamer = value.teamer;
    return true;
  });

  return teamer;
});

const options = computed<unknown[]>(() => {
  let people = props.people;

  if (gender.value !== undefined) {
    people = people.filter((value) => {
      return hasGenderProperty(value) && value.gender === gender.value;
    });
  }

  if (teamer.value !== undefined) {
    people = people.filter((value) => {
      return hasTeamerProperty(value) && value.teamer === teamer.value;
    });
  }

  return people;
});

function hasGenderProperty(value: unknown): value is { gender: string } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'gender' in value &&
    typeof value.gender === 'string'
  );
}

function hasTeamerProperty(value: unknown): value is { teamer: boolean } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'teamer' in value &&
    typeof value.teamer === 'boolean'
  );
}
</script>

<style scoped></style>
