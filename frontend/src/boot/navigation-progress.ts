import { defineBoot } from '#q-app';
import { LoadingBar } from 'quasar';
import type { RouteLocationNormalized } from 'vue-router';

// Below this, a navigation (cached chunk) finishes before the bar would be seen.
const SHOW_DELAY_MS = 150;

// Lazy route chunks are fetched by vue-router before it commits the navigation,
// which the XHR-based loading bar can't see — so drive it from the router too.
export default defineBoot(({ router }) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let active = false;
  let pending: RouteLocationNormalized | null = null;

  function done() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (active) {
      active = false;
      LoadingBar.stop();
    }
  }

  router.beforeEach((to) => {
    pending = to;
    if (timer !== null || active) {
      return;
    }
    timer = setTimeout(() => {
      timer = null;
      active = true;
      LoadingBar.start();
    }, SHOW_DELAY_MS);
  });

  // Cancelled navigations also reach afterEach; only the latest one ends the bar.
  router.afterEach((to) => {
    if (to === pending) {
      done();
    }
  });
  router.onError(done);
});
