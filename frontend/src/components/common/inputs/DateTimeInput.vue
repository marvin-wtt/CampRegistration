<template>
  <!-- TODO Mask and validate correctly  -->
  <q-input
    v-model="modelValue"
    hide-bottom-space
    outlined
    rounded
    v-bind="$attrs"
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

const { t } = useI18n();

const modelValue = defineModel<string | number>();
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
