import { EventBus } from 'quasar';
import { defineBoot } from '#q-app/wrappers';
import {
  AUTH_BUS,
  CAMP_BUS,
  REGISTRATION_BUS,
  TEMPLATE_BUS,
} from 'src/utils/keys';

export default defineBoot(({ app }) => {
  const busses = [AUTH_BUS, CAMP_BUS, REGISTRATION_BUS, TEMPLATE_BUS];

  for (const busName of busses) {
    const bus = new EventBus();

    // for Options API
    // app.config.globalProperties[`$${busName}`] = bus;

    // for Composition API
    app.provide<EventBus>(busName, bus);
  }
});
