<template>
  <!-- TODO Mask and validate correctly  -->
  <q-input
    v-model="modelValue"
    hide-bottom-space
    outlined
    rounded
    v-bind="attrs"
  >
    <template #append>
      <q-icon
        class="cursor-pointer"
        name="event"
      >
        <q-popup-proxy
          ref="popup"
          cover
          transition-hide="scale"
          transition-show="scale"
        >
          <q-date
            v-model="modelValue"
            mask="YYYY-MM-DD HH:mm"
          >
            <div class="row items-center justify-end">
              <q-btn
                v-close-popup
                color="primary"
                flat
                :label="t('actions.ok')"
              />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>

      <q-icon
        v-if="typeof modelValue === 'string'"
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
            mask="YYYY-MM-DD HH:mm"
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
import { useI18n } from 'vue-i18n';
import { type QInputSlots } from 'quasar';
import { useAttrs } from 'vue';

const attrs = useAttrs();
const { t } = useI18n();

type ModelValue = string | null | undefined;

const modelValue = defineModel<ModelValue>({
  get: isoToDateTime,
  set: dateTimeToIso,
});

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

  // Replace " " with "T" to make it a valid ISO string and append seconds/milliseconds
  const isoString = dateTime.replace(' ', 'T') + ':00.000Z';

  // Parse the resulting string to ensure validity and return it
  const date = new Date(isoString);

  // Convert back to ISO string
  return date.toISOString();
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
actions:
  ok: 'Ok'
</i18n>

<i18n lang="yaml" locale="de">
actions:
  ok: 'Ok'
</i18n>

<i18n lang="yaml" locale="fr">
actions:
  ok: 'Ok'
</i18n>

<i18n lang="yaml" locale="pl">
actions:
  ok: 'Ok'
</i18n>

<i18n lang="yaml" locale="cs">
actions:
  ok: 'Ok'
</i18n>
