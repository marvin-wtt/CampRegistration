<template>
  <q-popup-proxy
    transition-show="scale"
    transition-hide="fade"
    :offset="[10, 10]"
  >
    <q-card style="min-width: 300px">
      <q-card-actions align="right">
        <q-btn
          v-close-popup
          icon="edit"
          size="sm"
          flat
          rounded
          @click="onEdit"
        />
        <q-btn
          v-close-popup
          icon="delete"
          size="sm"
          flat
          rounded
          @click="onDelete"
        />
        <q-btn
          v-close-popup
          icon="close"
          size="sm"
          flat
          rounded
        />
      </q-card-actions>

      <q-card-section>
        <q-list>
          <!-- title -->
          <q-item>
            <q-item-section avatar>
              <q-icon
                name="circle"
                :style="{ color: props.event.color }"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-h6">
                {{ to(props.event.title) }}
              </q-item-label>
              <q-item-label caption>
                {{ dateTime }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <!-- plan (only shown when not 'both') -->
          <q-item v-if="props.event.plan !== 'both'">
            <q-item-section avatar>
              <q-icon :name="props.event.plan === 'a' ? 'wb_sunny' : 'water_drop'" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ props.event.plan === 'a' ? t('plan.a') : t('plan.b') }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="props.event.location">
            <q-item-section avatar>
              <q-icon name="place" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ to(props.event.location) }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="props.event.details">
            <q-item-section avatar>
              <q-icon name="description" />
            </q-item-section>
            <q-item-section style="white-space: pre-line">
              {{ to(props.event.details) }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-popup-proxy>
</template>

<script lang="ts" setup>
import type { ProgramEvent } from '@camp-registration/common/entities';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale, t } = useI18n();
const { to } = useObjectTranslation();

const props = defineProps<{
  event: ProgramEvent;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'delete'): void;
}>();

const dateTime = computed<string>(() => {
  if (!props.event.date) {
    return '';
  }

  const start = props.event.time
    ? new Date(props.event.date + ' ' + props.event.time)
    : new Date(props.event.date);
  const end = props.event.duration
    ? new Date(start.getTime() + props.event.duration * 60000)
    : start;

  const fullDay = !props.event.time && !props.event.duration;

  return new Intl.DateTimeFormat(locale.value, {
    month: 'long',
    day: '2-digit',
    weekday: 'long',
    hour: fullDay ? undefined : 'numeric',
    minute: fullDay ? undefined : 'numeric',
  }).formatRange(start, end);
});

function onDelete() {
  emit('delete');
}

function onEdit() {
  emit('edit');
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
plan:
  a: 'Plan A (good weather)'
  b: 'Plan B (bad weather)'
</i18n>

<i18n lang="yaml" locale="de">
plan:
  a: 'Plan A (gutes Wetter)'
  b: 'Plan B (schlechtes Wetter)'
</i18n>

<i18n lang="yaml" locale="fr">
plan:
  a: 'Plan A (beau temps)'
  b: 'Plan B (mauvais temps)'
</i18n>
