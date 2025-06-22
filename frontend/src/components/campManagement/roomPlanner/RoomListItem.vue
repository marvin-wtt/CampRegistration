<template>
  <q-item :dense>
    <q-item-section>
      <q-select
        v-model="model"
        :label
        option-label="name"
        :options
        clearable
        option-value="id"
        outlined
        rounded
        :dense
        :disable="!assignable"
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
import type { Roommate } from 'src/types/Room';

const model = defineModel<Roommate | null>({
  required: true,
});

const {
  position,
  options,
  dense = false,
  assignable = false,
} = defineProps<{
  position: number;
  options: unknown[];
  dense?: boolean;
  assignable?: boolean;
}>();

const flagVisible = computed<boolean>(() => {
  return model.value !== null && 'country' in model.value;
});

const flag = computed<string>(() => {
  return model.value?.country ?? '';
});

const label = computed<string>(() => {
  return '#' + position;
});

const selected = computed<string>(() => {
  const person = model.value;

  if (person === null) {
    return '';
  }

  return person.age === undefined
    ? person.name
    : `${person.name} (${person.age})`;
});
</script>

<style scoped></style>
