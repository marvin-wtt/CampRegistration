<template>
  <!-- A bottom sheet on phones, a centred dialog elsewhere. Both are driven
       the same way, so this can be the root of a dialog plugin component:
       `<responsive-dialog ref="dialogRef" @hide="onDialogHide">`. -->
  <bottom-sheet
    v-if="quasar.screen.lt.sm"
    v-model="open"
    no-padding
    @hide="emit('hide')"
  >
    <slot />
  </bottom-sheet>
  <q-dialog
    v-else
    v-model="open"
    @hide="emit('hide')"
  >
    <slot />
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import BottomSheet from '@/components/common/BottomSheet.vue';

const emit = defineEmits<{
  hide: [];
}>();

const quasar = useQuasar();
const open = ref<boolean>(false);

defineExpose({
  show: () => (open.value = true),
  hide: () => (open.value = false),
});
</script>
