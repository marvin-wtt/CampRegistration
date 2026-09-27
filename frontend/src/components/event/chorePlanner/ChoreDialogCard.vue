<template>
  <!-- Content of a ResponsiveDialog: header and actions stay put, only the
       body scrolls. Inside the phone's bottom sheet it is flat and fills it. -->
  <q-card
    class="dialog-card column no-wrap"
    :class="{ 'dialog-card--sheet': sheet }"
    :flat="sheet"
    :style="sheet ? undefined : { width: `min(${width}px, 95vw)` }"
  >
    <q-form
      class="column no-wrap col"
      @submit="emit('submit')"
      @reset="emit('cancel')"
    >
      <q-card-section
        class="row items-start no-wrap"
        :class="sheet ? 'q-pt-none q-pb-sm' : 'q-pb-sm'"
      >
        <div class="col">
          <div :class="sheet ? 'text-h6' : 'text-h5'">{{ title }}</div>
          <div
            v-if="subtitle"
            class="text-body2 text-grey-7 q-mt-xs"
          >
            {{ subtitle }}
          </div>
        </div>
        <slot name="header-actions" />
        <q-btn
          v-if="!$slots.actions"
          icon="close"
          flat
          round
          :aria-label="t('close')"
          @click="emit('cancel')"
        />
      </q-card-section>

      <!-- Stays put above the scrolling body, e.g. a search field. -->
      <div
        v-if="$slots.pinned"
        class="dialog-pinned"
        :class="{ 'dialog-pinned--separated': scrolled }"
      >
        <slot name="pinned" />
      </div>

      <q-card-section
        ref="body"
        class="col scroll q-pt-sm"
        @scroll="onScroll"
      >
        <!-- Wrapped, so its height can be observed as content comes and goes. -->
        <div ref="bodyContent">
          <slot />
        </div>
      </q-card-section>

      <q-card-actions
        v-if="$slots.actions"
        align="right"
        class="dialog-actions"
        :class="{ 'dialog-actions--separated': overflows }"
      >
        <slot name="actions" />
      </q-card-actions>
    </q-form>
  </q-card>
</template>

<script lang="ts" setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
} from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

withDefaults(
  defineProps<{
    title: string;
    subtitle?: string | undefined;
    width?: number;
  }>(),
  { width: 560, subtitle: undefined },
);

const emit = defineEmits<{
  submit: [];
  cancel: [];
}>();

const quasar = useQuasar();
const { t } = useI18n();

// Mirrors ResponsiveDialog's switch to a bottom sheet.
const sheet = computed<boolean>(() => quasar.screen.lt.sm);

// The line above the actions only when the body scrolls beneath them.
const body = useTemplateRef<{ $el: HTMLElement }>('body');
const bodyContent = useTemplateRef<HTMLElement>('bodyContent');
const overflows = ref<boolean>(false);
const scrolled = ref<boolean>(false);

function measure() {
  const el = body.value?.$el;
  overflows.value = !!el && el.scrollHeight > el.clientHeight + 1;
}

function onScroll() {
  scrolled.value = (body.value?.$el.scrollTop ?? 0) > 0;
}

function scrollToTop() {
  body.value?.$el.scrollTo({ top: 0 });
}

defineExpose({ scrollToTop });

const observer = new ResizeObserver(measure);

onMounted(() => {
  // Once up front; the observer keeps it current as content changes.
  void nextTick(measure);
  if (body.value) {
    observer.observe(body.value.$el);
  }
  if (bodyContent.value) {
    observer.observe(bodyContent.value);
  }
});

onBeforeUnmount(() => observer.disconnect());
</script>

<style scoped>
.dialog-card {
  max-width: 95vw;
  max-height: 90vh;
}

/* The sheet draws the surface and caps the height; the card fills it, so
   the body scrolls and the actions stay pinned. */
.dialog-card--sheet {
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  background: transparent;
}

.dialog-pinned {
  padding: 0 16px 8px;
  border-bottom: 1px solid transparent;
  transition: border-color 0.15s;
}

.dialog-pinned--separated {
  border-bottom-color: var(--md3-outline-variant);
}

.dialog-actions {
  border-top: 1px solid transparent;
  transition: border-color 0.15s;
  padding: 8px 16px calc(8px + env(safe-area-inset-bottom));
}

.dialog-actions--separated {
  border-top-color: var(--md3-outline-variant);
}
</style>

<i18n lang="yaml" locale="en">
close: 'Close'
</i18n>

<i18n lang="yaml" locale="de">
close: 'Schließen'
</i18n>

<i18n lang="yaml" locale="fr">
close: 'Fermer'
</i18n>

<i18n lang="yaml" locale="pl">
close: 'Zamknij'
</i18n>

<i18n lang="yaml" locale="cs">
close: 'Zavřít'
</i18n>
