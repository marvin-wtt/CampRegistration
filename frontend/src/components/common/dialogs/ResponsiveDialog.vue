<template>
  <!-- A bottom sheet on phones, a centred dialog elsewhere. Both are driven
       the same way, so this can be the root of a dialog plugin component:
       `<responsive-dialog ref="dialogRef" @hide="onDialogHide">`. -->
  <bottom-sheet
    v-if="quasar.screen.lt.sm"
    v-model="open"
    :persistent
    :snap-points
    no-padding
    @hide="emit('hide')"
  >
    <slot />
  </bottom-sheet>
  <q-dialog
    v-else
    v-model="open"
    :persistent
    @hide="emit('hide')"
  >
    <slot />
  </q-dialog>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar';
import BottomSheet, { type SnapPoint } from '@/components/BottomSheet.vue';

const { persistent = false, snapPoints = undefined } = defineProps<{
  persistent?: boolean;
  snapPoints?: SnapPoint[] | undefined;
}>();

const emit = defineEmits<{
  hide: [];
}>();

const quasar = useQuasar();
// Bind with v-model, or drive it via show()/hide().
const open = defineModel<boolean>({ default: false });

defineExpose({
  show: () => (open.value = true),
  hide: () => (open.value = false),
});
</script>
