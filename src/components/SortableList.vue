<template>
  <q-list
    :bordered="props.bordered"
    :separator="props.separator"
    :dense="props.dense"
    :padding="props.padding"
  >
    <!-- TODO Fix animation -->
    <TransitionGroup name="list">
      <q-item
        v-for="(item, index) in modelValue"
        :key="item[keyName] ?? index"
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
      clickable
      v-ripple
      @click="addItem"
    >
      <!-- TODO Create new -->
      <q-item-section class="text-center">+</q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts" setup>
import { TableTemplate } from 'src/types/TableTemplate';
import { computed } from 'vue';

interface Element {
  order: number;
}

interface Props {
  modelValue: Element[];
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
});

const emit = defineEmits<{
  (e: 'update:modelValue', modelValue: Element[]): void;
  (e: 'onAdd'): void;
  (e: 'onEdit', object: Element): void;
  (e: 'onDelete', object: Element): void;
}>();

const modelValue = computed<Element[]>({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function addItem() {
  emit('onAdd');
}

function editItem(item: Element) {
  emit('onEdit', item);
}

function deleteItem(item: Element) {
  emit('onDelete', item);
  if (!modelValue.value) {
    return;
  }
  const index = modelValue.value.indexOf(item);
  modelValue.value.splice(index, 1);
}

function orderUpwards(template: TableTemplate) {
  if (!modelValue.value) {
    return;
  }

  const index = modelValue.value.indexOf(template);
  if (index == 0) {
    return;
  }
  const previous = modelValue.value[index - 1];
  const previousOrder = previous.order;

  // Swap orders
  previous.order = template.order;
  template.order = previousOrder;

  // Swap position for animation
  modelValue.value.splice(index, 1, previous);
  modelValue.value.splice(index - 1, 1, template);
}

function orderDownwards(template: TableTemplate) {
  if (!modelValue.value) {
    return;
  }

  const index = modelValue.value.indexOf(template);
  if (index == modelValue.value.length - 1) {
    return;
  }
  const next = modelValue.value[index + 1];
  const nextOrder = next.order;
  // Swap orders
  next.order = template.order;
  template.order = nextOrder;

  // Swap position for animation
  modelValue.value.splice(index, 1, next);
  modelValue.value.splice(index + 1, 1, template);
}
</script>

<style scoped>
.list-move, /* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.list-leave-active {
  position: absolute;
}
</style>
