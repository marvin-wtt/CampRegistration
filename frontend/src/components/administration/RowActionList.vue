<template>
  <q-list style="min-width: 160px">
    <template
      v-for="(action, index) in actions"
      :key="action.key"
    >
      <q-separator v-if="action.separatorBefore && index > 0" />
      <q-item
        v-close-popup
        clickable
        :class="action.color ? `text-${action.color}` : undefined"
        @click="action.handler"
      >
        <q-item-section avatar>
          <q-icon :name="action.icon" />
        </q-item-section>
        <q-item-section>{{ action.label }}</q-item-section>
      </q-item>
    </template>
  </q-list>
</template>

<script lang="ts" setup>
import type { RowAction } from '@/components/administration/RowActions.vue';

const { actions } = defineProps<{
  actions: RowAction[];
}>();
</script>
