import type { InjectionKey } from 'vue';
import { type EventBus } from 'quasar';

export const AUTH_BUS: InjectionKey<EventBus> = Symbol('authBus');
export const EVENT_BUS: InjectionKey<EventBus> = Symbol('eventBus');
export const TEMPLATE_BUS: InjectionKey<EventBus> = Symbol('templateBus');
export const REGISTRATION_BUS: InjectionKey<EventBus> =
  Symbol('registrationBus');
export const ORGANIZATION_BUS: InjectionKey<EventBus> =
  Symbol('organizationBus');
