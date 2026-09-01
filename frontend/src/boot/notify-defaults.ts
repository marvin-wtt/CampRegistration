import { defineBoot } from '#q-app';
import { Notify } from 'quasar';

export default defineBoot(() => {
  Notify.setDefaults({
    position: 'top',
    classes: 'rounded-borders',
  });
});
