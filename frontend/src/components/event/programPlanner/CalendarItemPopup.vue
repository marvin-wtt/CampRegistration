<template>
  <!-- Marks the parent element whose clicks open the popup -->
  <span
    v-if="!noParentEvent"
    ref="anchor"
    hidden
  />

  <!-- A popover on larger screens keeps the calendar in view for a quick
       look; phones get a bottom sheet with thumb-sized actions instead. -->
  <bottom-sheet
    v-if="quasar.screen.lt.sm"
    v-model="open"
    no-padding
  >
    <calendar-item-details
      variant="sheet"
      v-bind="detailsProps"
      v-on="detailsListeners"
    />
  </bottom-sheet>
  <!-- Opens at the click rather than under the item: a tall item would
       otherwise squeeze it into the little space left below. Side and
       height are set in `show()`, as Quasar doesn't fit a click-anchored
       menu into the space on its side. -->
  <q-menu
    v-else
    ref="menu"
    v-model="open"
    no-parent-event
    touch-position
    :self="placement.self"
    :max-height="placement.maxHeight"
    :offset="[8, 8]"
    transition-show="jump-down"
    transition-hide="fade"
    class="item-popover"
  >
    <calendar-item-details
      variant="popover"
      v-bind="detailsProps"
      v-on="detailsListeners"
    />
  </q-menu>
</template>

<script lang="ts" setup>
import type { ProgramItem } from '@camp-registration/common/entities';
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  useTemplateRef,
} from 'vue';
import { type QMenu, useQuasar } from 'quasar';
import type { RouteLocationRaw } from 'vue-router';
import BottomSheet from '@/components/BottomSheet.vue';
import CalendarItemDetails from '@/components/event/programPlanner/CalendarItemDetails.vue';

const quasar = useQuasar();

const {
  item,
  editable = false,
  deletable = false,
  creatable = false,
  noParentEvent = false,
  plannerLink,
} = defineProps<{
  item: ProgramItem;
  editable?: boolean;
  deletable?: boolean;
  creatable?: boolean;
  // Disables the popup's default open-on-parent-click behavior so a caller
  // can decide itself (e.g. via `show()`) when the popup should open.
  noParentEvent?: boolean;
  // Read-only callers (e.g. the dashboard) link to the planner instead.
  plannerLink?: RouteLocationRaw;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'delete'): void;
  (e: 'duplicate'): void;
  (e: 'schedule'): void;
  (e: 'move-to-backlog'): void;
}>();

const open = ref(false);

const menu = useTemplateRef<QMenu>('menu');

const MARGIN = 16;

const placement = ref<{
  self: 'top left' | 'bottom left';
  maxHeight: string | undefined;
}>({ self: 'top left', maxHeight: undefined });

// The event positions the popover at the click, opening towards whichever
// side has more room and no taller than that room — long details then
// scroll inside it rather than pushing it off screen.
async function show(evt?: Event) {
  if (!menu.value) {
    open.value = true;
    return;
  }
  if (evt instanceof MouseEvent) {
    const below = window.innerHeight - evt.clientY;
    const above = evt.clientY;
    placement.value =
      below >= above
        ? { self: 'top left', maxHeight: `${below - MARGIN}px` }
        : { self: 'bottom left', maxHeight: `${above - MARGIN}px` };
    await nextTick();
  }
  menu.value.show(evt);
}

defineExpose({
  show,
  hide: () => (open.value = false),
});

const detailsProps = computed(() => ({
  item,
  editable,
  deletable,
  creatable,
  plannerLink,
}));

// Every action closes the popup before it is passed on
function closeThen(action: () => void) {
  return () => {
    open.value = false;
    action();
  };
}

const detailsListeners = {
  close: closeThen(() => undefined),
  edit: closeThen(() => emit('edit')),
  delete: closeThen(() => emit('delete')),
  duplicate: closeThen(() => emit('duplicate')),
  schedule: closeThen(() => emit('schedule')),
  'move-to-backlog': closeThen(() => emit('move-to-backlog')),
};

const anchor = useTemplateRef<HTMLElement>('anchor');
let parent: HTMLElement | null = null;

function onParentClick(evt: MouseEvent) {
  void show(evt);
}

onMounted(() => {
  parent = anchor.value?.parentElement ?? null;
  parent?.addEventListener('click', onParentClick);
});

onUnmounted(() => {
  parent?.removeEventListener('click', onParentClick);
});
</script>

<style>
/* Unscoped: the menu is teleported outside this component */
.q-menu.item-popover {
  /* The details bring their own padding; the theme's would leave a gap
     below the pinned actions for the scrolled text to show through */
  padding: 0;
  border-radius: 16px;
  background: var(--md3-surface-container-high);
}
</style>
