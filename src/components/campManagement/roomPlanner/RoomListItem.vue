<template>
  <q-item :dense="props.dense">
    <q-item-section>
      <q-select
        v-model="person"
        :label="label"
        option-label="name"
        :options="props.options"
        clearable
        option-value="id"
        outlined
        rounded
        :dense="props.dense"
      >
        <template #prepend>
          <country-icon
            v-if="flagVisible"
            :locale="flag"
          />
        </template>

        <template #selected>
          {{ selected }}
        </template>

        <template #option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section
              v-if="scope.opt.country"
              avatar
            >
              <country-icon :locale="scope.opt.country" />
            </q-item-section>
            <q-item-section>
              <q-item-label v-if="scope.opt.age">
                {{ `${scope.opt.name} (${scope.opt.age})` }}
              </q-item-label>
              <q-item-label v-else>
                {{ scope.opt.name }}
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
import CountryIcon from 'components/common/localization/CountryIcon.vue';
import { Roommate } from 'src/types/Roommate';

interface Props {
  modelValue: Roommate | null;
  position: number;
  options: unknown[];
  dense?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  dense: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void;
}>();

const flagVisible = computed<boolean>(() => {
  return props.modelValue !== null && 'country' in props.modelValue;
});

const flag = computed<string>(() => {
  return person.value?.country ?? '';
});

const person = computed<Roommate | null>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const label = computed<string>(() => {
  return '#' + props.position;
});

const selected = computed<string>(() => {
  const person = props.modelValue;

  if (person === null) {
    return '';
  }

  return person.age === undefined
    ? person.name
    : `${person.name} (${person.age})`;
});
</script>

<style scoped></style>
