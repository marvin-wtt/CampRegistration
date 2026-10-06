import { onBeforeUnmount, shallowRef } from 'vue';

/** The current time, refreshed on every full minute while the component lives. */
export function useMinuteClock() {
  const now = shallowRef(new Date());
  let timer: ReturnType<typeof setTimeout> | undefined;

  function schedule() {
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    timer = setTimeout(() => {
      now.value = new Date();
      schedule();
    }, msToNextMinute);
  }

  schedule();
  onBeforeUnmount(() => clearTimeout(timer));

  return now;
}
