<template>
  <q-item>
    <q-item-section>
      <q-select
        v-model="value"
        :options="options"
        clearable
        outlined
        rounded
        disable
      >
        <template #selected>
          <q-skeleton
            type="text"
            width="8rem"
          />
        </template>

        <template #option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section>
              <q-item-label>
                <q-skeleton
                  type="text"
                  width="8rem"
                />
              </q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const value = ref<string>('');

const options = ref(['']);
</script>

<style scoped></style>
