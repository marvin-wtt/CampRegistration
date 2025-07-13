<template>
  <q-list
    :bordered
    :separator
    :dense
    :padding
  >
    <TransitionGroup name="list">
      <q-item
        v-for="(item, index) in modelValue"
        :key="
          (item[keyName as keyof typeof item] as string | undefined) ?? index
        "
      >
        <slot :item="item" />
        <!-- Sorting arrows -->
        <q-item-section
          v-if="sortable"
          side
        >
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
          v-if="editable"
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
          v-if="deletable"
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
const {
  keyName = 'id',
  addable = true,
  editable = true,
  deletable = true,
  sortable = true,

  bordered = false,
  dense = false,
  padding = true,
  separator = false,
} = defineProps<{
  keyName?: string;
  addable?: boolean;
  editable?: boolean;
  deletable?: boolean;
  sortable?: boolean;

  bordered?: boolean;
  dense?: boolean;
  padding?: boolean;
  separator?: boolean;
}>();

const model = defineModel<T[]>({
  required: true,
});

const emit = defineEmits<{
  (e: 'add'): void;
  (e: 'edit', object: T): void;
  (e: 'delete', object: T): void;
}>();

function addItem() {
  emit('add');
}

function editItem(item: T) {
  emit('edit', item);
}

function deleteItem(item: T) {
  emit('delete', item);
  if (!model.value) {
    return;
  }
  const index = model.value.indexOf(item);
  model.value.splice(index, 1);

  // This is more robust against errors than only updating the following items
  updateOrder();
}

function orderUpwards(item: T) {
  if (!model.value) {
    return;
  }

  const index = model.value.indexOf(item);
  if (index == 0) {
    return;
  }
  const previous = model.value[index - 1]!;

  // Swap position for animation
  model.value.splice(index, 1, previous);
  model.value.splice(index - 1, 1, item);

  // Update order of all items. This is more robust against errors than swapping
  updateOrder();
}

function orderDownwards(item: T) {
  if (!model.value) {
    return;
  }

  const index = model.value.indexOf(item);
  if (index == model.value.length - 1) {
    return;
  }
  const next = model.value[index + 1]!;

  // Swap position for animation
  model.value.splice(index, 1, next);
  model.value.splice(index + 1, 1, item);

  // Update order of all items. This is more robust against errors than swapping
  updateOrder();
}

function updateOrder() {
  model.value.forEach((item, index) => {
    if ('order' in item) {
      item.order = index;
    } else if ('sortOrder' in item) {
      item.sortOrder = index;
    }
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
