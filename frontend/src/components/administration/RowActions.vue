<template>
  <div class="row items-center justify-center no-wrap">
    <!-- Wide screens: inline icon buttons -->
    <template v-if="quasar.screen.gt.md">
      <template
        v-for="(action, index) in visibleActions"
        :key="action.key"
      >
        <q-separator
          v-if="action.separatorBefore && index > 0"
          vertical
          class="q-mx-xs"
        />
        <q-btn
          :icon="action.icon"
          :color="action.color"
          round
          flat
          size="sm"
          @click="action.handler"
        >
          <q-tooltip>{{ action.label }}</q-tooltip>
        </q-btn>
      </template>
    </template>

    <!-- Small screens: overflow menu -->
    <q-btn
      v-else
      icon="more_vert"
      round
      flat
      size="sm"
    >
      <q-menu>
        <q-list style="min-width: 160px">
          <template
            v-for="(action, index) in visibleActions"
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
      </q-menu>
    </q-btn>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useQuasar } from 'quasar';

export interface RowAction {
  key: string;
  label: string;
  icon: string;
  color?: string;
  hidden?: boolean;
  separatorBefore?: boolean;
  handler: () => void;
}

const { actions } = defineProps<{
  actions: RowAction[];
}>();

const quasar = useQuasar();

const visibleActions = computed<RowAction[]>(() =>
  actions.filter((action) => !action.hidden),
);
</script>
