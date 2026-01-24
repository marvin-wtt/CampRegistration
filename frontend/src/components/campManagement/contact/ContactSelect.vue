<template>
  <q-select
    v-model="model"
    v-bind="$attrs"
    :options="filteredOptions"
    map-options
    emit-value
    use-input
    use-chips
    multiple
    hide-dropdown-icon
    clearable
    input-debounce="0"
    @filter="filterFn"
  >
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
          {{ t(`type.${scope.opt.type}`)[0] }}
          <q-tooltip>
            {{ t(`type.${scope.opt.type}`) }}
          </q-tooltip>
        </q-avatar>
        &nbsp;
        {{ scope.opt.name }}
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
            {{ t(`type.${scope.opt.type}`)[0] }}
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
import { useI18n } from 'vue-i18n';
import { type QSelectProps } from 'quasar';
import type { Registration } from '@camp-registration/common/entities';
import { computed, ref, watch } from 'vue';
import { useRegistrationHelper } from 'src/composables/registrationHelper';
import type { NamedColor } from 'quasar';
import { formatPersonName } from 'src/utils/formatters';
import { type Contact } from 'components/campManagement/contact/Contact';

const { t } = useI18n();
const { fullName, role, country } = useRegistrationHelper();

const model = defineModel<Contact[]>({
  required: true,
});

const props = defineProps<{
  registrations: Registration[];
}>();

watch(model, (value) => {
  const inGroupIds = new Set(
    value
      .filter((contact) => contact.type === 'group')
      .flatMap((group) => group.registrations.flatMap((contact) => contact.id)),
  );

  const hasDuplicates = value.some(
    (contact) =>
      contact.type !== 'group' && inGroupIds.has(contact.registration.id),
  );

  // Exit here to avoid endless update loop
  if (!hasDuplicates) {
    return;
  }

  model.value = model.value.filter(
    (contact) =>
      contact.type === 'group' || !inGroupIds.has(contact.registration.id),
  );
});

const filterQuery = ref<string>('');

const filterFn: QSelectProps['onFilter'] = (value, done) => {
  done(() => {
    filterQuery.value = value.toLowerCase();
  });
};

const filteredOptions = computed<Contact[]>(() => {
  return options.value
    .filter(
      (contact) => contact.name.toLowerCase().indexOf(filterQuery.value) > -1,
    )
    .filter((contact) => {
      if (!model.value) {
        return true;
      }

      if (contact.type === 'group') {
        return !model.value.some(
          (value) => value.type === 'group' && value.name === contact.name,
        );
      }

      return !model.value.some((value) => {
        if (value.type === 'group') {
          return value.registrations.some(
            ({ id }) => id === contact.registration.id,
          );
        }

        return value.registration.id === contact.registration.id;
      });
    });
});

const options = computed<Contact[]>(() => {
  const registrationOptions = props.registrations.map(
    (registration): Contact => ({
      registration,
      name: formatPersonName(fullName(registration)),
      type: getRegistrationType(registration),
    }),
  );

  const groupOptions = createGroups(props.registrations);

  return sortItems([...groupOptions, ...registrationOptions]);
});

function getRegistrationType(
  registration: Registration,
): Exclude<Contact['type'], 'group' | 'external'> {
  if (registration.status === 'PENDING') {
    throw new Error('Pending registrations should be filtered out beforehand.');
  }

  if (registration.status === 'WAITLISTED') {
    return 'waitingList';
  }

  const roleValue = role(registration);
  return roleValue === undefined || roleValue === 'participant'
    ? 'participant'
    : 'counselor';
}

const typeSortOrder: Contact['type'][] = [
  'group',
  'participant',
  'counselor',
  'waitingList',
];
const sortItems = (items: Contact[]) => {
  return items.sort((a, b) => {
    // Compare the types based on the order in the typeOrder array
    const typeComparison =
      typeSortOrder.indexOf(a.type) - typeSortOrder.indexOf(b.type);

    // If types are the same, sort by name alphabetically
    if (typeComparison === 0) {
      return a.name.localeCompare(b.name);
    }

    // Otherwise, sort by the type order
    return typeComparison;
  });
};

function createGroups(registrations: Registration[]): Contact[] {
  const dataArray = registrations
    .filter((registration) => registration.status === 'PENDING')
    .map((registration) => ({
      name: fullName(registration),
      country: country(registration),
      role: role(registration),
      waitingList: registration.status === 'WAITLISTED',
      registration,
    }));

  const groups = dataArray.reduce(
    (groups, data) => {
      // Only use categoryA and categoryB for creating the key
      const key = JSON.stringify([data.role, data.country, data.waitingList]);
      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(data);

      return groups;
    },
    {} as Record<string, typeof dataArray>,
  );

  return Object.entries(groups).map(([key, data]) => {
    return {
      name: getGroupName(...JSON.parse(key)),
      registrations: data.map((data) => data.registration),
      type: 'group',
    };
  });
}

function getGroupName(
  role?: string,
  country?: string,
  waitingList?: string,
): string {
  let name = role ? getRoleTranslation(role) : t('type.participant');

  if (country) {
    name += ` - ${country}`;
  }

  if (waitingList) {
    name += ` (${t('type.waitingList')})`;
  }

  return name;
}

function getRoleTranslation(name: string): string {
  const key = `role.${name}`;
  const value = t(key);

  return value === key ? name : value;
}

const typeColors: Record<Contact['type'], NamedColor> = {
  group: 'accent',
  participant: 'primary',
  counselor: 'secondary',
  waitingList: 'warning',
};
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
type:
  counselor: 'Counselor'
  group: 'Group'
  participant: 'Participant'
  waitingList: 'Waiting list'

role:
  counselor: 'Counselor'
  participant: 'Participant'
</i18n>

<i18n lang="yaml" locale="de">
type:
  counselor: 'Betreuer'
  group: 'Gruppe'
  participant: 'Teilnehmer'
  waitingList: 'Warteliste'

role:
  counselor: 'Betreuer'
  participant: 'Teilnehmer'
</i18n>

<i18n lang="yaml" locale="fr">
type:
  counselor: 'Conseiller'
  group: 'Groupe'
  participant: 'Participant'
  waitingList: 'Liste d’attente'

role:
  counselor: 'Conseiller'
  participant: 'Participant'
</i18n>

<i18n lang="yaml" locale="pl">
type:
  counselor: 'Opiekun'
  group: 'Grupa'
  participant: 'Uczestnik'
  waitingList: 'Lista oczekujących'

role:
  counselor: 'Opiekun'
  participant: 'Uczestnik'
</i18n>

<i18n lang="yaml" locale="cs">
type:
  counselor: 'Vedoucí'
  group: 'Skupina'
  participant: 'Účastník'
  waitingList: 'Čekací listina'

role:
  counselor: 'Vedoucí'
  participant: 'Účastník'
</i18n>
