import { EventBus } from 'quasar';
import { boot } from 'quasar/wrappers';
import { AUTH_BUS, CAMP_BUS, REGISTRATION_BUS, TEMPLATE_BUS } from 'src/utils/keys';

export default boot(({ app }) => {
  const busses = [AUTH_BUS, CAMP_BUS, REGISTRATION_BUS, TEMPLATE_BUS];

  for (const busName of busses) {
    const bus = new EventBus();

    // for Options API
    // app.config.globalProperties[`$${busName}`] = bus;

    // for Composition API
    app.provide<EventBus>(busName, bus);
  }
});
