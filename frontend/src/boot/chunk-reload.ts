import { defineBoot } from '#q-app';

// A lazy chunk failed to load, usually because a deploy replaced it — reload.
export default defineBoot(() => {
  window.addEventListener('vite:preloadError', () => {
    window.location.reload();
  });
});
