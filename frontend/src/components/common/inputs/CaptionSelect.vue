<template>
  <q-select
    v-model="model"
    v-bind="selectProps"
    :options
    emit-value
    map-options
  >
    <template #option="scope">
      <q-item
        :key="scope.index"
        v-bind="scope.itemProps"
      >
        <q-item-section>
          <q-item-label>
            {{ scope.opt.label }}
          </q-item-label>
          <q-item-label
            v-if="scope.opt.caption"
            caption
          >
            {{ scope.opt.caption }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>

    <!-- Parent slots -->
    <template
      v-for="(_, name) in slots"
      :key="name"
      #[name]
    >
      <slot :name />
    </template>
  </q-select>
</template>

<script lang="ts">
import type { QSelectOption } from 'quasar';

export interface CaptionSelectOption<T = string> extends QSelectOption<T> {
  caption?: string | undefined;
}
</script>

<script lang="ts" setup generic="T extends string | number | object = string">
import { type QSelectProps } from 'quasar';
import {
  type ForwardedFieldSlots,
  usePassthroughProps,
} from '@/composables/passthroughProps';

interface Props extends Omit<
  QSelectProps,
  'modelValue' | 'onUpdate:modelValue' | 'options' | 'emitValue' | 'mapOptions'
> {
  options: CaptionSelectOption<T>[];
}

const model = defineModel<T | T[] | undefined>();
const slots = defineSlots<ForwardedFieldSlots>();

const props = defineProps<Props>();

const selectProps = usePassthroughProps(props, ['options']);
</script>

<style scoped></style>
