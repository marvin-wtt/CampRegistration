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

        <span class="q-ml-xs">
          {{ scope.opt.name }}
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
          <q-item-label>
            {{ scope.opt.name }}
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
import type { Contact } from '@/components/campManagement/contact/Contact';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { formatPersonName } from '@/utils/formatters';

const attrs = useAttrs();
const quasar = useQuasar();
const { t } = useI18n();
const { fullName, role, country } = useRegistrationHelper();

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

const options = computed<Contact[]>(() => {
  const registrationOptions = props.registrations.map(
    (registration): Contact => ({
      registration,
      name: formatPersonName(fullName(registration)),
      type: getRegistrationType(registration),
    }),
  );

  return sortItems([
    ...createGroups(props.registrations),
    ...registrationOptions,
  ]);
});

const selectedContactKeys = computed<Set<string>>(
  () => new Set(model.value.map(getContactKey)),
);

const selectedRegistrationIds = computed<Set<string>>(() => {
  const ids = new Set<string>();

  for (const contact of model.value) {
    if (contact.type === 'group') {
      for (const registration of contact.registrations) {
        ids.add(registration.id);
      }
    } else {
      ids.add(contact.registration.id);
    }
  }

  return ids;
});

const filteredOptions = computed<Contact[]>(() => {
  const query = filterQuery.value;

  return options.value.filter((contact) => {
    if (query.length > 0 && !foldForSearch(contact.name).includes(query)) {
      return false;
    }

    if (contact.type === 'group') {
      return !selectedContactKeys.value.has(getContactKey(contact));
    }

    return !selectedRegistrationIds.value.has(contact.registration.id);
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

function normalizeContacts(contacts: Contact[]): Contact[] {
  const registrationsInGroups = new Set<string>();

  for (const contact of contacts) {
    if (contact.type !== 'group') {
      continue;
    }

    for (const registration of contact.registrations) {
      registrationsInGroups.add(registration.id);
    }
  }

  const seenContactKeys = new Set<string>();

  return contacts.filter((contact) => {
    if (
      contact.type !== 'group' &&
      registrationsInGroups.has(contact.registration.id)
    ) {
      return false;
    }

    const key = getContactKey(contact);

    if (seenContactKeys.has(key)) {
      return false;
    }

    seenContactKeys.add(key);
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

function getRegistrationType(
  registration: Registration,
): Exclude<Contact['type'], 'group'> {
  if (registration.status === 'PENDING') {
    return 'pending';
  }

  if (registration.status === 'WAITLISTED') {
    return 'waitingList';
  }

  const registrationRole = role(registration);

  return registrationRole === undefined || registrationRole === 'participant'
    ? 'participant'
    : 'counselor';
}

interface ContactGroupData {
  role: string;
  country?: string | undefined;
  waitingList: boolean;
  registrations: Registration[];
}

function createGroups(registrations: Registration[]): Contact[] {
  const groups = new Map<string, ContactGroupData>();

  for (const registration of registrations) {
    // Pending registrations are offered only as individual contacts
    if (registration.status === 'PENDING') {
      continue;
    }

    const registrationRole = role(registration);
    const registrationCountry = country(registration);
    const waitingList = registration.status === 'WAITLISTED';

    const key = JSON.stringify([
      registrationRole ?? null,
      registrationCountry ?? null,
      waitingList,
    ]);

    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.registrations.push(registration);
      continue;
    }

    groups.set(key, {
      role: registrationRole,
      country: registrationCountry,
      waitingList,
      registrations: [registration],
    });
  }

  return Array.from(groups.values(), (group): Contact => ({
    type: 'group',
    name: getGroupName(group.role, group.country, group.waitingList),
    registrations: group.registrations,
  }));
}

function getGroupName(
  groupRole?: string,
  groupCountry?: string,
  waitingList = false,
): string {
  let name = groupRole ? getRoleTranslation(groupRole) : t('type.participant');

  if (groupCountry) {
    name += ` - ${groupCountry}`;
  }

  if (waitingList) {
    name += ` (${t('type.waitingList')})`;
  }

  return name;
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

function sortItems(items: Contact[]): Contact[] {
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

<i18n lang="yaml" locale="en">
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
