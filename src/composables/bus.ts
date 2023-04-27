import { inject } from 'vue';
import { EventBus } from 'quasar';
import {
  AUTH_BUS,
  CAMP_BUS,
  REGISTRATION_BUS,
  TEMPLATE_BUS,
} from 'src/utils/keys';

export function useAuthBus(): EventBus {
  return inject(AUTH_BUS, new EventBus());
}

export function useCampBus(): EventBus {
  return inject(CAMP_BUS, new EventBus());
}

export function useRegistrationBus(): EventBus {
  return inject(REGISTRATION_BUS, new EventBus());
}

export function useTemplateBus(): EventBus {
  return inject(TEMPLATE_BUS, new EventBus());
}
