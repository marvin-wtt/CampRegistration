<template>
  <!-- An overflow menu: a dropdown on larger screens, a bottom sheet of
       actions on phones, where a small menu is hard to hit. -->
  <q-btn
    :icon
    :aria-label="label"
    :size
    flat
    round
    v-bind="$attrs"
    @click.stop="useSheet && (sheetOpen = true)"
  >
    <q-menu
      v-if="!useSheet"
      auto-close
    >
      <q-list style="min-width: 220px">
        <q-item
          v-for="item in shown"
          :key="item.label"
          clickable
          @click="item.onClick"
        >
          <q-item-section avatar>
            <q-icon
              :name="item.icon"
              :color="item.color"
            />
          </q-item-section>
          <q-item-section :class="item.color ? `text-${item.color}` : ''">
            {{ item.label }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>

  <bottom-sheet
    v-if="useSheet"
    v-model="sheetOpen"
    no-padding
  >
    <div
      v-if="title"
      class="text-subtitle1 text-weight-medium q-px-md q-pb-sm ellipsis"
    >
      {{ title }}
    </div>
    <q-list class="q-pb-md">
      <q-item
        v-for="item in shown"
        :key="item.label"
        clickable
        class="sheet-item"
        @click="run(item)"
      >
        <q-item-section avatar>
          <q-icon
            :name="item.icon"
            :color="item.color"
          />
        </q-item-section>
        <q-item-section :class="item.color ? `text-${item.color}` : ''">
          {{ item.label }}
        </q-item-section>
      </q-item>
    </q-list>
  </bottom-sheet>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import BottomSheet from '@/components/BottomSheet.vue';

export interface ResponsiveMenuItem {
  label: string;
  icon: string;
  /** A color role, e.g. `negative` for a destructive action. */
  color?: string | undefined;
  hidden?: boolean | undefined;
  onClick: () => void;
}

defineOptions({ inheritAttrs: false });

const {
  items,
  label,
  title = undefined,
  icon = 'more_vert',
  size = undefined,
} = defineProps<{
  items: ResponsiveMenuItem[];
  /** The button's accessible name. */
  label: string;
  /** Heads the sheet, naming what the actions apply to. */
  title?: string | undefined;
  icon?: string;
  size?: string | undefined;
}>();

const quasar = useQuasar();
const sheetOpen = ref(false);

const useSheet = computed(() => quasar.screen.xs);
const shown = computed(() => items.filter((item) => !item.hidden));

function run(item: ResponsiveMenuItem) {
  sheetOpen.value = false;
  item.onClick();
}
</script>

<style scoped>
.sheet-item {
  min-height: 56px;
}
</style>
