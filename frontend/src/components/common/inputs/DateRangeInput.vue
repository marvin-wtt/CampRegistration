<template>
  <!--
    The wrapper exists to anchor the picker: QPopupProxy attaches to its parent
    element, and QInput does not render a default slot to host it. Anchoring to
    the wrapper lets the popup cover the whole field instead of a trailing icon,
    so no append affordance is needed.
  -->
  <div
    class="date-range-input"
    @mousedown.capture="onFieldMousedown"
  >
    <q-input
      :model-value="displayValue"
      v-bind="{ ...inputProps, ...$attrs }"
      class="cursor-pointer"
      @focus="openPicker"
      @click="onFieldClick"
      @keydown="onKeydown"
      @update:model-value="onFieldUpdate"
    >
      <!-- Parent slots -->
      <template
        v-for="(_, name) in slots"
        :key="name"
        #[name]
      >
        <slot :name />
      </template>
    </q-input>

    <q-popup-proxy
      ref="popup"
      transition-hide="scale"
      transition-show="scale"
      cover
      no-parent-event
      no-route-dismiss
      @show="pickerOpen = true"
      @hide="pickerOpen = false"
    >
      <q-date
        v-model="model"
        mask="YYYY-MM-DD"
        :range="!singleDay"
      >
        <div class="row items-center justify-between">
          <q-toggle
            :model-value="singleDay"
            :label="t('field.singleDay')"
            @update:model-value="onSingleDayToggle"
          />
          <q-btn
            v-close-popup
            :label="t('actions.ok')"
            color="primary"
            flat
          />
        </div>
      </q-date>
    </q-popup-proxy>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { date as dateUtil, type QInputProps, type QPopupProxy } from 'quasar';
import {
  type ForwardedFieldSlots,
  usePassthroughProps,
} from '@/composables/passthroughProps';

// Attributes stay on the field rather than landing on the anchor wrapper, so
// `class`, `data-test` and the like keep behaving as they did without it.
defineOptions({ inheritAttrs: false });

const { t } = useI18n();

interface Props extends Omit<
  QInputProps,
  'modelValue' | 'onUpdate:modelValue' | 'onFocus' | 'readonly'
> {
  // Time of day (HH:mm, local) applied when a date is set without an
  // existing time to preserve
  defaultStartTime?: string | undefined;
  defaultEndTime?: string | undefined;
}

type DateRange = { from?: string | undefined; to?: string | undefined };

const slots = defineSlots<ForwardedFieldSlots>();

const props = withDefaults(defineProps<Props>(), {
  defaultStartTime: '09:00',
  defaultEndTime: '18:00',
  hideBottomSpace: true,
  outlined: true,
  rounded: true,
});

const inputProps = usePassthroughProps(props, [
  'from',
  'to',
  'defaultStartTime',
  'defaultEndTime',
]);

// QDate rejects a plain date string in range mode and a {from, to} object in
// single mode, so the model shape must follow the singleDay toggle.
const model = defineModel<DateRange | string | undefined>({
  get: () =>
    singleDay.value
      ? (toDay(from.value) ?? toDay(to.value))
      : { from: toDay(from.value), to: toDay(to.value) },
  set: (value) => {
    // QDate emits a plain date string in single-day mode, and also in range
    // mode when the selection starts and ends on the same day.
    applyRange(typeof value === 'string' ? { from: value, to: value } : value);
  },
});

const from = defineModel<string | undefined>('from');
const to = defineModel<string | undefined>('to');

const popup = useTemplateRef<QPopupProxy>('popup');
const pickerOpen = ref<boolean>(false);
let clearPressed = false;

/** Keys that must keep working so the field stays keyboard-navigable. */
const PASSTHROUGH_KEYS = new Set([
  'Tab',
  'Escape',
  'Enter',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

/**
 * The field displays the range but never edits it, so the one update it can emit
 * is the clearable ✕ handing back null — which has to clear both ends.
 */
function onFieldUpdate(value: string | number | null): void {
  if (!value) {
    applyRange();
  }
}

/**
 * Closing the picker hands focus back to the field, and that focus event arrives
 * *before* the popup finishes hiding. Showing it again from there leaves QMenu
 * wedged — it believes it is open while nothing is rendered, and every later
 * show() is ignored. Tracking the open state keeps the reopen honest.
 */
function openPicker(): void {
  if (pickerOpen.value || clearPressed) {
    return;
  }

  popup.value?.show();
}

/**
 * The clearable ✕ sits inside the field, and pressing it both focuses the field
 * and fires a click — either of which would reopen the picker the user just
 * dismissed. mousedown precedes both, and the capture phase gets there before
 * Quasar stops the event on the icon itself. The veto releases itself so a
 * swallowed click can never leave the picker permanently shut.
 */
function onFieldMousedown(event: MouseEvent): void {
  if (!isClearAction(event.target)) {
    return;
  }

  vetoOpen();
}

/** Blocks the open that the ✕ would otherwise cause, until the event settles. */
function vetoOpen(): void {
  clearPressed = true;
  setTimeout(() => {
    clearPressed = false;
  });
}

function isClearAction(target: EventTarget | null): boolean {
  return (
    (target as HTMLElement | null)?.closest('.q-field__focusable-action') !=
    null
  );
}

function onFieldClick(event: MouseEvent): void {
  // Re-armed here as well as on mousedown: Quasar focuses the field from its own
  // clear handler, which runs after this click and would otherwise sail past a
  // veto that had already expired.
  if (isClearAction(event.target)) {
    vetoOpen();
    return;
  }

  openPicker();
}

/**
 * The value comes from the picker, never from typing. `readonly` would enforce
 * that but restyles the field, so swallow the editing keys instead — otherwise
 * the typed text would drift away from the one-way bound model.
 */
function onKeydown(event: KeyboardEvent): void {
  if (PASSTHROUGH_KEYS.has(event.key) || event.ctrlKey || event.metaKey) {
    return;
  }

  event.preventDefault();
}

const singleDay = ref<boolean>(isSingleDay());

watch([from, to], () => {
  singleDay.value = isSingleDay();
});

const displayValue = computed<string | undefined>(() => {
  const fromDay = toDay(from.value);
  const toDayStr = toDay(to.value);

  if (!fromDay || !toDayStr) {
    return undefined;
  }

  return fromDay === toDayStr ? fromDay : `${fromDay} - ${toDayStr}`;
});

function isSingleDay(): boolean {
  return !!from.value && toDay(from.value) === toDay(to.value);
}

function onSingleDayToggle(value: boolean): void {
  singleDay.value = value;

  if (value) {
    const day = toDay(from.value) ?? toDay(to.value);
    if (day) {
      applyRange({ from: day, to: day });
    }
  }
}

function applyRange(range?: DateRange): void {
  from.value = toIso(range?.from, from.value, props.defaultStartTime);
  to.value = toIso(range?.to, to.value, props.defaultEndTime);
}

function toDay(iso?: string): string | undefined {
  return iso ? dateUtil.formatDate(new Date(iso), 'YYYY-MM-DD') : undefined;
}

function toIso(
  day: string | undefined,
  currentIso: string | undefined,
  defaultTime: string,
): string | undefined {
  if (!day) {
    return undefined;
  }

  const [year = 0, month = 1, dayOfMonth = 1] = day.split('-').map(Number);

  // Keep the existing time of day; fall back to the default time when the
  // date is set for the first time.
  if (currentIso) {
    const result = new Date(currentIso);
    result.setFullYear(year, month - 1, dayOfMonth);
    return result.toISOString();
  }

  const [hours = 0, minutes = 0] = defaultTime.split(':').map(Number);
  return new Date(year, month - 1, dayOfMonth, hours, minutes).toISOString();
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
actions:
  ok: 'Ok'
field:
  singleDay: 'Single day'
</i18n>

<i18n lang="yaml" locale="de">
actions:
  ok: 'Ok'
field:
  singleDay: 'Eintägig'
</i18n>

<i18n lang="yaml" locale="fr">
actions:
  ok: 'Ok'
field:
  singleDay: 'Un seul jour'
</i18n>

<i18n lang="yaml" locale="pl">
actions:
  ok: 'Ok'
field:
  singleDay: 'Jeden dzień'
</i18n>

<i18n lang="yaml" locale="cs">
actions:
  ok: 'Ok'
field:
  singleDay: 'Jeden den'
</i18n>
