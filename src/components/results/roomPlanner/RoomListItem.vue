<template>
  <q-item>
    <q-item-section>
      <q-select
        v-model="person"
        :label="label"
        :option-label="optionLabel"
        :options="props.options"
        clearable
        option-value="id"
        outlined
        rounded
      >
        <template v-slot:prepend>
          <country-icon
            v-if="person"
            :locale="person.country"
          />
        </template>

        <template v-slot:selected>
          {{ selected }}
        </template>

        <template v-slot:option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section avatar>
              <country-icon :locale="scope.opt.country" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ `${scope.opt[optionLabel]} (${scope.opt.age})` }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import CountryIcon from 'components/localization/CountryIcon.vue';

interface Props {
  modelValue: unknown;
  position: number;
  options: unknown[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void;
}>();

const person = computed<unknown>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const optionLabel = computed<string>(() => {
  // TODO
  return 'first_name';
});

const label = computed<string>(() => {
  return '#' + props.position;
});

const age = computed<number | string>(() => {
  const person = props.modelValue;
  return person !== null &&
    typeof person === 'object' &&
    'age' in person &&
    typeof person.age === 'number'
    ? person.age
    : '?';
});

const selected = computed<string>(() => {
  const person = props.modelValue;
  return person !== null && typeof person === 'object' && 'first_name' in person
    ? `${person.first_name} (${age.value})`
    : '';
});
</script>

<style scoped></style>
