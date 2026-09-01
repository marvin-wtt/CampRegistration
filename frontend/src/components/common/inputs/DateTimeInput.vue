<template>
  <!-- TODO Mask and validate correctly  -->
  <q-input
    v-model="modelValue"
    v-bind="inputProps"
  >
    <template #append>
      <q-icon
        class="cursor-pointer"
        name="event"
      >
        <q-popup-proxy
          ref="datePopup"
          cover
          transition-hide="scale"
          transition-show="scale"
        >
          <q-date
            v-model="modelValue"
            mask="YYYY-MM-DD HH:mm"
            @update:model-value="onDateSelected"
          />
        </q-popup-proxy>
      </q-icon>

      <q-icon
        v-if="typeof modelValue === 'string'"
        class="cursor-pointer"
        name="schedule"
      >
        <q-popup-proxy
          ref="timePopup"
          cover
          transition-hide="scale"
          transition-show="scale"
        >
          <q-time
            v-model="modelValue"
            mask="YYYY-MM-DD HH:mm"
            format24h
          >
            <div class="row items-center justify-end">
              <q-btn
                v-close-popup
                color="primary"
                flat
                :label="t('close')"
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
import { useI18n } from 'vue-i18n';
import { type QInputProps, type QPopupProxy } from 'quasar';
import { nextTick, useTemplateRef } from 'vue';
import {
  type ForwardedFieldSlots,
  usePassthroughProps,
} from '@/composables/passthroughProps';

const { t } = useI18n();

type Props = Omit<QInputProps, 'modelValue' | 'onUpdate:modelValue'>;

type ModelValue = string | null | undefined;

const modelValue = defineModel<ModelValue>({
  get: isoToDateTime,
  set: dateTimeToIso,
});
const props = defineProps<Props>();
const slots = defineSlots<ForwardedFieldSlots>();

const inputProps = usePassthroughProps(props);

const datePopup = useTemplateRef<QPopupProxy>('datePopup');
const timePopup = useTemplateRef<QPopupProxy>('timePopup');

function onDateSelected() {
  datePopup.value?.hide();
  void nextTick(() => timePopup.value?.show());
}

function isoToDateTime(isoDate: ModelValue): ModelValue {
  if (!isoDate) {
    return isoDate;
  }

  const date = new Date(isoDate);

  // Extract parts of the date
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  // Return in "YYYY-MM-DD HH:mm" format
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function dateTimeToIso(dateTime: ModelValue): ModelValue {
  if (!dateTime) {
    return dateTime;
  }

  // "YYYY-MM-DD HH:mm" → ["YYYY-MM-DD", "HH:mm"]
  const [datePart, timePart] = dateTime.split(' ');
  if (!datePart || !timePart) {
    return null;
  }

  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  if (!year || !month || !day || hour === undefined || minute === undefined) {
    return null;
  }

  // Create local time → store as UTC
  const date = new Date(year, month - 1, day, hour, minute);

  // Convert back to ISO string
  return date.toISOString();
}
</script>

<style scoped></style>

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
