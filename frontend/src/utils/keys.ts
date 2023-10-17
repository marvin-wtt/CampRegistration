import type { InjectionKey } from 'vue';
import { EventBus } from 'quasar';

export const AUTH_BUS: InjectionKey<EventBus> = Symbol('authBus');
export const CAMP_BUS: InjectionKey<EventBus> = Symbol('campBus');
export const TEMPLATE_BUS: InjectionKey<EventBus> = Symbol('templateBus');
export const REGISTRATION_BUS: InjectionKey<EventBus> =
  Symbol('registrationBus');
