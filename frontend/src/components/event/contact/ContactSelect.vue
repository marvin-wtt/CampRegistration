<template>
  <q-select
    ref="selectRef"
    v-model="selected"
    v-bind="attrs"
    :options="filteredOptions"
    option-label="name"
    use-input
    use-chips
    multiple
    hide-dropdown-icon
    clearable
    input-debounce="0"
    @filter="filterFn"
  >
    <!-- Mobile needs a way to close the popup -->
    <template
      v-if="quasar.platform.is.mobile"
      #before-options
    >
      <q-item dense>
        <q-item-section>
          <q-item-label class="text-subtitle2">
            {{ t('selector.selectContacts') }}
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-btn
            type="button"
            color="primary"
            icon="check"
            round
            dense
            :aria-label="t('selector.done')"
            @click.stop="closePopup"
          />
        </q-item-section>
      </q-item>

      <q-separator />
    </template>

    <template #selected-item="scope">
      <q-chip
        removable
        dense
        :tabindex="scope.tabindex"
        text-color="secondary"
        class="q-ma-xs"
        @remove="scope.removeAtIndex(scope.index)"
      >
        <q-avatar
          :color="typeColors[scope.opt.type as Contact['type']]"
          text-color="white"
          class="text-capitalize"
        >
          {{ getTypeInitial(scope.opt.type as Contact['type']) }}
          <q-tooltip>
            {{ t(`type.${scope.opt.type}`) }}
          </q-tooltip>
        </q-avatar>

        <span class="q-ml-xs">{{ contactLabel(scope.opt) }}</span>
        <country-icon
          v-if="contactCountry(scope.opt)"
          :country="contactCountry(scope.opt)!"
          class="contact-flag q-ml-xs"
        />
        <span
          v-if="scope.opt.type === 'group'"
          class="contact-count q-ml-xs"
        >
          {{ scope.opt.registrations.length }}
        </span>
      </q-chip>
    </template>

    <template #option="scope">
      <q-item
        v-bind="scope.itemProps"
        dense
      >
        <q-item-section avatar>
          <q-avatar
            :color="typeColors[scope.opt.type as Contact['type']]"
            text-color="white"
            size="sm"
            class="text-capitalize"
          >
            {{ getTypeInitial(scope.opt.type as Contact['type']) }}
            <q-tooltip>
              {{ t(`type.${scope.opt.type}`) }}
            </q-tooltip>
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label class="contact-option__label">
            {{ contactLabel(scope.opt) }}
            <country-icon
              v-if="contactCountry(scope.opt)"
              :country="contactCountry(scope.opt)!"
              class="contact-flag"
            />
          </q-item-label>
          <q-item-label
            v-if="scope.opt.type === 'group'"
            caption
          >
            {{ t('people', scope.opt.registrations.length) }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script lang="ts" setup>
import type { Registration } from '@camp-registration/common/entities';
import type { NamedColor, QSelectProps } from 'quasar';
import { QSelect, useQuasar } from 'quasar';
import { computed, ref, useAttrs, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Contact } from '@/components/event/contact/Contact';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { useRegistrationContact } from '@/composables/registrationContact';
import { contactRegistrations } from '@/components/event/contact/contactHelpers';
import { useEventStatistics } from '@/composables/eventStatistics';
import CountryIcon from '@/components/common/localization/CountryIcon.vue';
import { countryName } from '@/utils/countries';

const attrs = useAttrs();
const quasar = useQuasar();
const { t, locale } = useI18n();
const { role, country } = useRegistrationHelper();
const { contactFor } = useRegistrationContact();
const stats = useEventStatistics();

const selectRef = useTemplateRef<QSelect>('selectRef');
const filterQuery = ref('');

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  registrations: Registration[];
}>();

const model = defineModel<Contact[]>({
  required: true,
});

const selected = computed<Contact[]>({
  get: () => model.value,

  set: (value) => {
    model.value = normalizeContacts(value ?? []);
  },
});

watch(model, (value) => {
  const normalized = normalizeContacts(value);

  if (normalized.length !== value.length) {
    model.value = normalized;
  }
});

// The server refuses pending registrations, so they are never offered.
const sendable = computed<Registration[]>(() =>
  props.registrations.filter((r) => r.status !== 'PENDING'),
);

// Countries matter only for events held across several, like the dashboard's.
const multiCountry = computed<boolean>(
  () => stats.multiCountryEvent.value,
);

const options = computed<Contact[]>(() => [
  ...createGroups(sendable.value),
  ...sortIndividuals(sendable.value.map(contactFor)),
]);

const selectedRegistrationIds = computed<Set<string>>(() => {
  const ids = new Set<string>();

  for (const contact of model.value) {
    for (const registration of contactRegistrations(contact)) {
      ids.add(registration.id);
    }
  }

  return ids;
});

// A group stays offered while it would add someone.
const filteredOptions = computed<Contact[]>(() => {
  const query = filterQuery.value;

  return options.value.filter((contact) => {
    if (
      query.length > 0 &&
      !foldForSearch(contactLabel(contact)).includes(query)
    ) {
      return false;
    }

    return contactRegistrations(contact).some(
      (registration) => !selectedRegistrationIds.value.has(registration.id),
    );
  });
});

const filterFn: QSelectProps['onFilter'] = (value, done) => {
  done(() => {
    filterQuery.value = foldForSearch(value.trim());
  });
};

// Normalise a string for accent-insensitive matching so that searching e.g.
// "muller" matches "Müller" — names in this app span de/fr/cs/pl locales and are
// frequently accented. Decomposes characters (NFD), strips the combining
// diacritical marks, then lowercases.
function foldForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
}

function closePopup(): void {
  selectRef.value?.hidePopup();
}

// Drops whatever a larger selected group already covers: smaller groups and
// individuals alike, so nobody is listed (or sent to) twice.
function normalizeContacts(contacts: Contact[]): Contact[] {
  const covered = new Set<string>();
  const keptGroups = new Set<Contact>();

  const groups = contacts
    .filter((contact) => contact.type === 'group')
    .sort((a, b) => b.registrations.length - a.registrations.length);

  for (const group of groups) {
    if (group.registrations.every((r) => covered.has(r.id))) {
      continue;
    }
    keptGroups.add(group);
    group.registrations.forEach((r) => covered.add(r.id));
  }

  const seen = new Set<string>();

  return contacts.filter((contact) => {
    const kept =
      contact.type === 'group'
        ? keptGroups.has(contact)
        : !covered.has(contact.registration.id);
    const key = getContactKey(contact);
    if (!kept || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getContactKey(contact: Contact): string {
  if (contact.type === 'group') {
    const registrationIds = contact.registrations
      .map((registration) => registration.id)
      .sort()
      .join(',');

    return `group:${registrationIds}`;
  }

  return `registration:${contact.registration.id}`;
}

interface ContactGroupData {
  role: string | undefined;
  waitingList: boolean;
  registrations: Registration[];
}

const roleOrder: Record<string, number> = { participant: 0, counselor: 1 };

// One group per role and waitlist status. Across countries it also splits by
// country, keeping the whole as a group of its own.
function createGroups(registrations: Registration[]): Contact[] {
  const groups = new Map<string, ContactGroupData>();

  for (const registration of registrations) {
    const registrationRole = role(registration);
    const waitingList = registration.status === 'WAITLISTED';
    const key = JSON.stringify([registrationRole ?? null, waitingList]);

    const group = groups.get(key);
    if (group) {
      group.registrations.push(registration);
    } else {
      groups.set(key, {
        role: registrationRole,
        waitingList,
        registrations: [registration],
      });
    }
  }

  // The role only tells waitlist groups apart when more than one is waiting.
  const qualifyWaitlist =
    [...groups.values()].filter((g) => g.waitingList).length > 1;

  return [...groups.values()]
    .sort(
      (a, b) =>
        Number(a.waitingList) - Number(b.waitingList) ||
        (roleOrder[a.role ?? 'participant'] ?? 2) -
          (roleOrder[b.role ?? 'participant'] ?? 2) ||
        (a.role ?? '').localeCompare(b.role ?? ''),
    )
    .flatMap((group) => splitByCountry(group, qualifyWaitlist));
}

function splitByCountry(
  group: ContactGroupData,
  qualifyWaitlist: boolean,
): Contact[] {
  const name = getGroupName(group.role, group.waitingList, qualifyWaitlist);
  const whole: Contact = {
    type: 'group',
    name,
    registrations: group.registrations,
  };
  if (!multiCountry.value) {
    return [whole];
  }

  const byCountry = new Map<string | null, Registration[]>();
  for (const registration of group.registrations) {
    const code = country(registration) ?? null;
    byCountry.set(code, [...(byCountry.get(code) ?? []), registration]);
  }

  const parts = [...byCountry.entries()]
    .map(([code, members]): Contact => ({
      type: 'group',
      name,
      country: code,
      registrations: members,
    }))
    // Those without a country last.
    .sort((a, b) =>
      a.type === 'group' && b.type === 'group'
        ? Number(a.country === null) - Number(b.country === null) ||
          countryLabel(a.country).localeCompare(countryLabel(b.country))
        : 0,
    );

  // Within a single country, that country's group is the whole group.
  return parts.length > 1 ? [whole, ...parts] : parts;
}

// Waitlist groups lead with the status: it is what sets them apart.
function getGroupName(
  groupRole: string | undefined,
  waitingList: boolean,
  qualifyWaitlist: boolean,
): string {
  const roleName = groupRole
    ? getRoleTranslation(groupRole)
    : t('type.participant');

  if (!waitingList) {
    return roleName;
  }
  return qualifyWaitlist
    ? `${t('type.waitingList')} (${roleName})`
    : t('type.waitingList');
}

function countryLabel(code: string | null | undefined): string {
  return code ? countryName(code, locale.value) : t('country.unknown');
}

/** The group name with its country: shown, and searched. */
function contactLabel(contact: Contact): string {
  if (contact.type !== 'group' || !multiCountry.value) {
    return contact.name;
  }
  const scope =
    contact.country === undefined
      ? t('country.all')
      : countryLabel(contact.country);

  return `${contact.name} · ${scope}`;
}

function contactCountry(contact: Contact): string | undefined {
  if (!multiCountry.value) {
    return undefined;
  }
  return contact.type === 'group'
    ? (contact.country ?? undefined)
    : country(contact.registration);
}

function getRoleTranslation(name: string): string {
  const key = `role.${name}`;
  const translated = t(key);

  return translated === key ? name : translated;
}

function getTypeInitial(type: Contact['type']): string {
  return t(`type.${type}`).charAt(0);
}

const typeSortOrder: Record<Contact['type'], number> = {
  group: 0,
  participant: 1,
  counselor: 2,
  waitingList: 3,
  pending: 4,
};

function sortIndividuals(items: Contact[]): Contact[] {
  return [...items].sort((a, b) => {
    const typeComparison = typeSortOrder[a.type] - typeSortOrder[b.type];

    return typeComparison || a.name.localeCompare(b.name);
  });
}

const typeColors: Record<Contact['type'], NamedColor> = {
  group: 'accent',
  participant: 'primary',
  counselor: 'secondary',
  waitingList: 'warning',
  pending: 'grey',
};
</script>

<style scoped>
.contact-option__label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.contact-flag {
  flex: 0 0 auto;
  width: 1.25em;
  border-radius: 2px;
}

.contact-count {
  padding: 0 6px;
  font-size: 0.75em;
  font-weight: 600;
  background: var(--md3-surface-container-highest);
  border-radius: 999px;
}
</style>

<i18n lang="yaml" locale="en">
people: '{n} person | {n} people'
country:
  all: 'All countries'
  unknown: 'No country'

selector:
  selectContacts: 'Select contacts'
  done: 'Done'

type:
  counselor: 'Counselor'
  group: 'Group'
  participant: 'Participant'
  waitingList: 'Waiting list'
  pending: 'Pending'

role:
  counselor: 'Counselor'
  participant: 'Participant'
</i18n>

<i18n lang="yaml" locale="de">
people: '{n} Person | {n} Personen'
country:
  all: 'Alle Länder'
  unknown: 'Ohne Land'

selector:
  selectContacts: 'Kontakte auswählen'
  done: 'Fertig'

type:
  counselor: 'Betreuer'
  group: 'Gruppe'
  participant: 'Teilnehmer'
  waitingList: 'Warteliste'
  pending: 'Ausstehend'

role:
  counselor: 'Betreuer'
  participant: 'Teilnehmer'
</i18n>

<i18n lang="yaml" locale="fr">
people: '{n} personne | {n} personnes'
country:
  all: 'Tous les pays'
  unknown: 'Sans pays'

selector:
  selectContacts: 'Sélectionner des contacts'
  done: 'Terminé'

type:
  counselor: 'Conseiller'
  group: 'Groupe'
  participant: 'Participant'
  waitingList: 'Liste d’attente'
  pending: 'En attente'

role:
  counselor: 'Conseiller'
  participant: 'Participant'
</i18n>

<i18n lang="yaml" locale="pl">
people: '{n} osoba | {n} osób'
country:
  all: 'Wszystkie kraje'
  unknown: 'Bez kraju'

selector:
  selectContacts: 'Wybierz kontakty'
  done: 'Gotowe'

type:
  counselor: 'Opiekun'
  group: 'Grupa'
  participant: 'Uczestnik'
  waitingList: 'Lista oczekujących'
  pending: 'Oczekujące'

role:
  counselor: 'Opiekun'
  participant: 'Uczestnik'
</i18n>

<i18n lang="yaml" locale="cs">
people: '{n} osoba | {n} osob'
country:
  all: 'Všechny země'
  unknown: 'Bez země'

selector:
  selectContacts: 'Vybrat kontakty'
  done: 'Hotovo'

type:
  counselor: 'Vedoucí'
  group: 'Skupina'
  participant: 'Účastník'
  waitingList: 'Čekací listina'
  pending: 'Čekající'

role:
  counselor: 'Vedoucí'
  participant: 'Účastník'
</i18n>
