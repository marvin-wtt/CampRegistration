<template>
  <div class="task-notes column no-wrap">
    <template
      v-for="(block, index) in blocks"
      :key="index"
    >
      <div
        v-if="block.kind === 'text'"
        class="notes-text"
      >
        {{ block.text }}
      </div>

      <ul
        v-else-if="block.kind === 'bullets'"
        class="notes-bullets"
      >
        <li
          v-for="(item, itemIndex) in block.items"
          :key="itemIndex"
        >
          {{ item }}
        </li>
      </ul>

      <q-list
        v-else
        dense
        class="notes-checklist"
      >
        <q-item
          v-for="item in block.items"
          :key="item.line"
          :tag="interactive ? 'label' : 'div'"
          :clickable="interactive"
          class="checklist-item rounded-md"
          :data-test="`task-checklist-item-${item.line}`"
        >
          <q-item-section
            avatar
            class="checklist-box"
          >
            <q-checkbox
              v-if="interactive"
              :model-value="item.checked"
              color="primary"
              dense
              @update:model-value="emit('toggle', item.line)"
            />
            <q-icon
              v-else
              :name="item.checked ? 'check_box' : 'check_box_outline_blank'"
              :color="item.checked ? 'primary' : undefined"
              size="20px"
            />
          </q-item-section>
          <q-item-section
            :class="{ 'checklist-text--done': item.checked }"
            class="checklist-text"
          >
            {{ item.text }}
          </q-item-section>
        </q-item>
      </q-list>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { parseNotes } from '@/utils/taskNotes';

const { notes, interactive = false } = defineProps<{
  notes: string;
  interactive?: boolean;
}>();

const emit = defineEmits<{
  toggle: [line: number];
}>();

const blocks = computed(() => parseNotes(notes));
</script>

<style scoped>
.task-notes {
  gap: 8px;
  font-size: 14px;
  line-height: 1.5;
}

.notes-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.notes-bullets {
  margin: 0;
  padding-left: 20px;
}

.notes-checklist {
  margin: 0 -8px;
}

.checklist-item {
  min-height: 36px;
  padding: 2px 8px;
}

.checklist-box {
  min-width: 0;
  padding-right: 10px;
}

.checklist-text {
  word-break: break-word;
}

.checklist-text--done {
  color: var(--md3-on-surface-variant);
  text-decoration: line-through;
}
</style>
