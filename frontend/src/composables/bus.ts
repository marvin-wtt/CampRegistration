import { inject } from 'vue';
import { EventBus } from 'quasar';
import {
  AUTH_BUS,
  CAMP_BUS,
  REGISTRATION_BUS,
  TEMPLATE_BUS,
} from 'src/utils/keys';
import type {
  Camp,
  Registration,
  Profile,
} from '@camp-registration/common/entities';

export function useAuthBus(): EventBus<{
  login: (user: Profile) => void;
  logout: () => void;
}> {
  return inject(AUTH_BUS, new EventBus());
}

export function useCampBus(): EventBus<{
  change: (camp?: Camp, oldCamp?: Camp) => void;
  create: (camp: Camp) => void;
  update: (camp: Camp) => void;
  delete: (campId: string) => void;
}> {
  return inject(CAMP_BUS, new EventBus());
}

export function useRegistrationBus(): EventBus<{
  create: (registration: Registration) => void;
  update: (registration: Registration) => void;
  delete: (registrationId: string) => void;
}> {
  return inject(REGISTRATION_BUS, new EventBus());
}

export function useTemplateBus(): EventBus {
  return inject(TEMPLATE_BUS, new EventBus());
}
