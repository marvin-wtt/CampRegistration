<template>
  <q-input
    v-model="modelValue"
    hide-bottom-space
    outlined
    rounded
    v-bind="$attrs"
    @focus="($refs.popup as QPopupProxy).show()"
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
            v-model="modelValue"
            mask="HH:mm"
            format24h
          >
            <div class="row items-center justify-end">
              <q-btn
                v-close-popup
                color="primary"
                flat
                :label="t('actions.ok')"
              />
            </div>
          </q-time>
        </q-popup-proxy>
      </q-icon>
    </template>

    <!-- Parent slots -->
    <template
      v-for="(data, name, index) in $slots as unknown as QInputSlots"
      :key="index"
      #[name]
    >
      <slot
        :name="name"
        v-bind="data"
      />
    </template>
  </q-input>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { type QInputSlots, type QPopupProxy } from 'quasar';

const { t } = useI18n();

interface Props {
  modelValue?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value?: string): void;
}>();

const modelValue = computed<string | undefined>({
  get: () => isoToTime(props.modelValue),
  set: (val) => emit('update:modelValue', timeToIso(val)),
});

function isoToTime(dateString?: string): string | undefined {
  if (!dateString) {
    return undefined;
  }

  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}

function timeToIso(inputTime?: string): string | undefined {
  const dateString = props.modelValue;
  if (!dateString || !inputTime) {
    return undefined;
  }

  const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;
  if (!timeRegex.test(inputTime)) {
    return undefined;
  }

  const [hours, minutes] = inputTime.split(':').map(Number);

  const date = new Date(dateString);
  date.setHours(hours);
  date.setMinutes(minutes);

  return date.toISOString();
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
actions:
  ok: Ok
</i18n>

<i18n lang="yaml" locale="en">
actions:
  ok: Ok
</i18n>

<i18n lang="yaml" locale="en">
actions:
  ok: Ok
</i18n>
