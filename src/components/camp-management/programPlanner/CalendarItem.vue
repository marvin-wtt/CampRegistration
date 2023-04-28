<template>
  <div
    v-if="props.event.time !== undefined"
    class="my-event"
    :class="badgeClasses"
    :style="badgeStyles"
  >
    <span class="title q-calendar__ellipsis">
      {{ props.event.title }}
      <q-tooltip>
        {{ props.event.details }}
      </q-tooltip>
    </span>
  </div>
</template>

<script lang="ts" setup>
import { ProgramEvent } from 'src/types/ProgramEvent';
import { computed } from 'vue';

interface Props {
  event: ProgramEvent;
  timeStartPosition?: (time?: string) => number;
  timeDurationHeight?: (duration?: number) => number;
}

const props = defineProps<Props>();

const backgroundColor = computed<string>(() => {
  return props.event.backgroundColor ?? '#0000ff';
});

const badgeClasses = computed<Record<string, string | boolean>>(() => {
  return {
    [`text-white bg-${props.event.backgroundColor}`]: true,
    'full-width': !props.event.side || props.event.side === 'full',
    'left-side': props.event.side === 'left',
    'right-side': props.event.side === 'right',
    'rounded-border': true,
  };
});

const badgeStyles = computed(() => {
  const s: {
    top: string;
    height: string;
    backgroundColor: string;
  } = {};
  if (props.timeStartPosition && props.timeDurationHeight) {
    s.top = props.timeStartPosition(props.event.time) + 'px';
    s.height = props.timeDurationHeight(props.event.duration) + 'px';
    s.backgroundColor = backgroundColor.value;
  }
  s['align-items'] = 'flex-start';
  return s;
});
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

.full-width
  left: 0
  width: calc(100% - 2px)

.left-side
  left: 0
  width: calc(50% - 3px)

.right-side
  left: 50%
  width: calc(50% - 3px)

  .rounded-border
    border-radius: 2px
</style>
