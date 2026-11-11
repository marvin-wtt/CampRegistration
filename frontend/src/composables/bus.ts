import { EventBus } from 'quasar';
import type {
  Event,
  Organization,
  Profile,
} from '@camp-registration/common/entities';

// App-wide singletons: every store and component shares the same bus, also
// outside an injection context (e.g. a resource created in a plain function).
const authBus = new EventBus<{
  login: (user: Profile) => void;
  logout: () => void;
}>();

// Keeps the events list, details and assigned events in sync with each other.
const eventBus = new EventBus<{
  create: (event: Event) => void;
  update: (event: Event) => void;
  delete: (eventId: string) => void;
}>();

// Keeps the organizations list in sync with the details view.
const organizationBus = new EventBus<{
  update: (organization: Organization) => void;
  delete: (organizationId: string) => void;
}>();

export function useAuthBus() {
  return authBus;
}

export function useEventBus() {
  return eventBus;
}

export function useOrganizationBus() {
  return organizationBus;
}
