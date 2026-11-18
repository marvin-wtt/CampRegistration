<template>
  <!-- The whole screen for one signature; turning the phone makes it bigger. -->
  <q-dialog
    ref="dialogRef"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    @hide="onDialogHide"
  >
    <div class="sign-full column no-wrap">
      <div class="row items-center no-wrap q-pl-md q-pr-sm q-py-sm">
        <div class="col text-subtitle1 ellipsis">{{ label }}</div>
        <m-btn
          icon="close"
          flat
          round
          color="on-surface-variant"
          :aria-label="t('cancel')"
          @click="onDialogCancel"
        />
      </div>

      <div class="col column items-center justify-center q-px-md">
        <div class="pad-box">
          <signature-pad
            v-model="signature"
            :label
            :clear-label
            fill
            data-test="signature-fullscreen"
          />
        </div>
        <div
          v-if="portrait"
          class="row items-center no-wrap q-gutter-x-sm text-body2 text-on-surface-variant q-mt-md"
        >
          <q-icon name="screen_rotation" />
          <span>{{ t('rotate') }}</span>
        </div>
      </div>

      <div class="actions row justify-end q-gutter-sm q-px-md q-py-sm">
        <m-btn
          :label="t('cancel')"
          text
          rounded
          @click="onDialogCancel"
        />
        <m-btn
          :label="t('apply')"
          icon="check"
          color="primary"
          rounded
          data-test="signature-fullscreen-apply"
          @click="onDialogOK(signature)"
        />
      </div>
    </div>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import SignaturePad from '@/components/common/inputs/SignaturePad.vue';

const { initial, label, clearLabel } = defineProps<{
  /** What was drawn so far, kept and continued here. */
  initial: string | null;
  label: string;
  clearLabel: string;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const quasar = useQuasar();
const { t } = useI18n();

const signature = ref<string | null>(initial);
const portrait = computed(() => quasar.screen.height > quasar.screen.width);

// Not in lib.dom any more, and missing on iOS: tried, never relied on.
type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>;
};

let enteredFullscreen = false;
let locked = false;

// Android locks the orientation only in fullscreen; elsewhere the hint
// asks the person to turn the phone.
onMounted(async () => {
  const orientation = screen.orientation as LockableOrientation | undefined;
  if (!quasar.platform.is.mobile || !orientation?.lock) {
    return;
  }
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      enteredFullscreen = true;
    }
    await orientation.lock('landscape');
    locked = true;
  } catch {
    // Declined or unsupported: the hint stands in.
  }
});

onBeforeUnmount(() => {
  if (locked) {
    screen.orientation.unlock();
  }
  if (enteredFullscreen && document.fullscreenElement) {
    document.exitFullscreen().catch(() => undefined);
  }
});
</script>

<style scoped>
.sign-full {
  width: 100vw;
  height: 100dvh;
  background: var(--md3-surface);
  color: var(--md3-on-surface);
}

/* As wide as fits while the 3 : 1 pad, its clear button and the bars
   still fit the height. */
.pad-box {
  width: min(100%, calc((100dvh - 190px) * 3));
}

.actions {
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
}
</style>

<i18n lang="yaml" locale="en">
apply: 'Use signature'
cancel: 'Cancel'
rotate: 'Turn your phone for more room.'
</i18n>

<i18n lang="yaml" locale="de">
apply: 'Übernehmen'
cancel: 'Abbrechen'
rotate: 'Dreh dein Handy für mehr Platz.'
</i18n>

<i18n lang="yaml" locale="fr">
apply: 'Utiliser la signature'
cancel: 'Annuler'
rotate: 'Tournez votre téléphone pour plus de place.'
</i18n>

<i18n lang="yaml" locale="pl">
apply: 'Użyj podpisu'
cancel: 'Anuluj'
rotate: 'Obróć telefon, aby mieć więcej miejsca.'
</i18n>

<i18n lang="yaml" locale="cs">
apply: 'Použít podpis'
cancel: 'Zrušit'
rotate: 'Otoč telefon pro víc místa.'
</i18n>
