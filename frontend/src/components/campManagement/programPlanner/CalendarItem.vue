<template>
  <div
    v-if="props.event.time"
    class="my-event"
    :class="badgeClasses"
    :style="badgeStyles"
  >
    <span class="title q-calendar__ellipsis">
      {{ to(props.event.title) }}
      <q-tooltip
        v-if="props.event.details"
        class="column text-caption"
        style="white-space: pre-line"
      >
        {{ to(props.event.details) }}
      </q-tooltip>
    </span>

    <calendar-item-popup
      :event="props.event"
      @edit="onEdit"
      @delete="onDelete"
    />
  </div>
</template>

<script lang="ts" setup>
import type { ProgramEvent } from '@camp-registration/common/entities';
import { computed, type StyleValue } from 'vue';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import CalendarItemPopup from 'components/campManagement/programPlanner/CalendarItemPopup.vue';

const props = defineProps<{
  event: ProgramEvent;
  viewBoth?: boolean;
  timeStartPosition?: (time?: string) => number;
  timeDurationHeight?: (duration?: number) => number;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'delete'): void;
}>();

const { to } = useObjectTranslation();

const backgroundColor = computed<string>(() => {
  return props.event.color ?? '#0000ff';
});

const badgeClasses = computed<Record<string, string | boolean>>(() => {
  return {
    [`text-white bg-${props.event.color}`]: true,
    'rounded-border': true,
  };
});

const badgeStyles = computed<StyleValue>(() => {
  const top =
    props.timeStartPosition && props.event.time
      ? props.timeStartPosition(props.event.time) + 'px'
      : undefined;

  const height =
    props.timeDurationHeight && props.event.duration
      ? props.timeDurationHeight(props.event.duration) + 'px'
      : undefined;

  let left = '0';
  let width = 'calc(100% - 2px)';

  if (props.viewBoth && props.event.plan !== 'both') {
    width = 'calc(50% - 2px)';
    if (props.event.plan === 'b') {
      left = '50%';
    }
  }

  return {
    backgroundColor: backgroundColor.value,
    alignItems: 'flex-start',
    top,
    height,
    left,
    width,
  };
});

function onDelete() {
  emit('delete');
}

function onEdit() {
  emit('edit');
}
</script>

<style lang="sass" scoped>
.my-event
  position: absolute
  font-size: 12px
  justify-content: center
  margin: 0 1px
  text-overflow: ellipsis
  overflow: hidden
  cursor: pointer

.title
  position: relative
  display: flex
  justify-content: center
  align-items: center
  height: 100%

.rounded-border
  border-radius: 2px
</style>
