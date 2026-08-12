<template>
  <q-input
    v-model="time"
    v-bind="inputProps"
    @focus="popup?.show()"
    @blur="onBlur"
  >
    <template #append>
      <q-icon
        class="cursor-pointer"
        name="schedule"
      >
        <q-popup-proxy
          ref="popup"
          cover
          transition-hide="scale"
          transition-show="scale"
        >
          <q-time
            v-model="time"
            mask="HH:mm"
            format24h
          >
            <div class="row items-center justify-end">
              <q-btn
                v-close-popup
                color="primary"
                flat
                :label="t('action.ok')"
              />
            </div>
          </q-time>
        </q-popup-proxy>
      </q-icon>
    </template>

    <!-- Parent slots -->
    <template
      v-for="(_, name) in slots"
      :key="name"
      #[name]
    >
      <slot :name />
    </template>
  </q-input>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { type QInputProps, type QPopupProxy } from 'quasar';
import {
  type ForwardedFieldSlots,
  usePassthroughProps,
} from '@/composables/passthroughProps';

type Props = Omit<
  QInputProps,
  'modelValue' | 'onUpdate:modelValue' | 'onFocus' | 'onBlur'
>;

const TIME_REGEX = /^(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;

const { t } = useI18n();

const model = defineModel<string | undefined>();
const slots = defineSlots<ForwardedFieldSlots>();

const props = withDefaults(defineProps<Props>(), {
  hideBottomSpace: true,
  outlined: true,
  rounded: true,
});

const inputProps = usePassthroughProps(props);

const popup = useTemplateRef<QPopupProxy>('popup');

// The typed text is kept locally so half-typed input ("0", "09:") does not
// reach the model — it carries the date as well, which clearing it would
// throw away.
const text = ref<string | undefined>(isoToTime(model.value));

watch(model, (value) => {
  text.value = isoToTime(value);
});

const time = computed<string | undefined>({
  get: () => text.value,
  set: (value) => {
    text.value = value;

    if (!value) {
      model.value = undefined;
      return;
    }

    const iso = timeToIso(value);
    if (iso) {
      model.value = iso;
    }
  },
});

// Input that never became a valid time leaves the field showing something the
// model does not hold, so drop it once editing ends.
function onBlur() {
  text.value = isoToTime(model.value);
}

function isoToTime(dateString?: string): string | undefined {
  if (!dateString) {
    return undefined;
  }

  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}

function timeToIso(inputTime: string): string | undefined {
  if (!TIME_REGEX.test(inputTime)) {
    return undefined;
  }

  const [hours, minutes] = inputTime.split(':').map(Number);

  // Without a value yet the time alone has no day to sit on — anchor it to
  // today, so picking a date afterwards keeps this time of day.
  const date = model.value ? new Date(model.value) : new Date();
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0);

  return date.toISOString();
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
action:
  ok: 'Ok'
</i18n>

<i18n lang="yaml" locale="de">
action:
  ok: 'Ok'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  ok: 'Ok'
</i18n>

<i18n lang="yaml" locale="pl">
action:
  ok: 'Ok'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  ok: 'Ok'
</i18n>
