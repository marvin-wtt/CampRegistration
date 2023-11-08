<template>
  <q-list
    :bordered="props.bordered"
    :separator="props.separator"
    :dense="props.dense"
    :padding="props.padding"
  >
    <TransitionGroup name="list">
      <q-item
        v-for="(item, index) in modelValue"
        :key="
          (item[props.keyName as keyof typeof item] as string | undefined) ??
          index
        "
      >
        <slot :item="item" />
        <!-- Sorting arrows -->
        <q-item-section side>
          <q-btn
            dense
            round
            flat
            icon="arrow_upward"
            size="xs"
            @click.stop="orderUpwards(item)"
          />
          <q-btn
            dense
            round
            flat
            icon="arrow_downward"
            size="xs"
            @click.stop="orderDownwards(item)"
          />
        </q-item-section>
        <!-- Edit -->
        <q-item-section
          v-if="props.editable"
          side
        >
          <q-btn
            flat
            dense
            rounded
            icon="edit"
            @click="editItem(item)"
          />
        </q-item-section>
        <!-- Delete -->
        <q-item-section
          v-if="props.deletable"
          side
        >
          <q-btn
            flat
            dense
            rounded
            icon="delete"
            @click.stop="deleteItem(item)"
          />
        </q-item-section>
      </q-item>
    </TransitionGroup>
    <q-item
      v-if="addable"
      v-ripple
      clickable
      @click="addItem"
    >
      <q-item-section class="column content-center">
        <q-icon name="add" />
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts" generic="T extends object" setup>
import { computed } from 'vue';

interface Props {
  modelValue: T[];
  keyName?: string;
  addable?: boolean;
  editable?: boolean;
  deletable?: boolean;

  bordered?: boolean;
  dense?: boolean;
  padding?: boolean;
  separator?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  addable: false,
  editable: false,
  deletable: false,
  keyName: 'id',
});

const emit = defineEmits<{
  (e: 'update:modelValue', modelValue: T[]): void;
  (e: 'add'): void;
  (e: 'edit', object: T): void;
  (e: 'delete', object: T): void;
}>();

const modelValue = computed<T[]>({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function addItem() {
  emit('add');
}

function editItem(item: T) {
  emit('edit', item);
}

function deleteItem(item: T) {
  emit('delete', item);
  if (!modelValue.value) {
    return;
  }
  const index = modelValue.value.indexOf(item);
  modelValue.value.splice(index, 1);

  // Update order of all items
  // This is more robust against errors than only updating the following items
  updateOrder();
}

function orderUpwards(item: T) {
  if (!modelValue.value) {
    return;
  }

  const index = modelValue.value.indexOf(item);
  if (index == 0) {
    return;
  }
  const previous = modelValue.value[index - 1];
  if (!('order' in item) || !('order' in previous)) {
    return;
  }

  const previousOrder = previous.order;

  // Swap orders
  previous.order = item.order;
  item.order = previousOrder;

  // Swap position for animation
  modelValue.value.splice(index, 1, previous);
  modelValue.value.splice(index - 1, 1, item);
}

function orderDownwards(item: T) {
  if (!modelValue.value) {
    return;
  }

  const index = modelValue.value.indexOf(item);
  if (index == modelValue.value.length - 1) {
    return;
  }
  const next = modelValue.value[index + 1];

  // Swap position for animation
  modelValue.value.splice(index, 1, next);
  modelValue.value.splice(index + 1, 1, item);

  // Update order of all items. This is more robust against errors than swapping
  updateOrder();
}

function updateOrder() {
  modelValue.value.forEach((item, index) => {
    if (!('order' in item)) {
      return;
    }
    item.order = index;
  });
}
</script>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-active {
  position: absolute;
}
</style>
