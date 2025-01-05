<template>
  <q-select
    v-model="model"
    v-bind="attrs"
    :options
  >
    <template #option="scope">
      <q-expansion-item
        v-if="scope.opt.children != null"
        :label="scope.opt.label"
        :default-opened="hasChild(scope.opt.children)"
        expand-separator
        group="expenses"
        header-class="text-weight-bold"
      >
        <template
          v-for="child in scope.opt.children"
          :key="child.value"
        >
          <q-item
            v-ripple
            v-close-popup
            clickable
            :class="{ 'text-primary': model === child.value }"
            @click="model = child.value"
          >
            <q-item-section>
              <q-item-label class="q-ml-md">
                {{ child.label }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-expansion-item>
      <q-item
        v-else
        v-ripple
        v-close-popup
        clickable
        @click="model = scope.opt.value"
      >
        <q-item-section>
          <q-item-label>
            {{ scope.opt.label }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <!-- Forward slots -->
    <template
      v-for="(data, name, index) in slots"
      :key="index"
      #[name]
    >
      <!-- @vue-ignore -->
      <slot
        :name="name"
        v-bind="data"
      />
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { ExpenseCategory } from 'components/campManagement/expenses/ExpenseCategory.ts';
import { useAttrs } from 'vue';
import { QSelectSlots } from 'quasar';

const model = defineModel<string>();
const attrs = useAttrs();
const slots = defineSlots<QSelectSlots>();
const { options } = defineProps<{
  options: ExpenseCategory[];
}>();

function hasChild(children: ExpenseCategory[]) {
  return children.some((c) => c.label === model.value);
}
</script>

<style scoped></style>
