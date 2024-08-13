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
    @new-value="onNewValue"
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
          :color="typeColors[scope.opt.type as ContactType]"
          text-color="white"
          class="text-capitalize"
        >
          {{ t(`type.${scope.opt.type}`)[0] }}
          <q-tooltip>
            {{ t(`type.${scope.opt.type}`) }}
          </q-tooltip>
        </q-avatar>
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
            :color="typeColors[scope.opt.type as ContactType]"
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
import { QSelectProps } from 'quasar';
import { CampManager, Registration } from '@camp-registration/common/entities';
import { computed, ref } from 'vue';
import { useRegistrationHelper } from 'src/composables/registrationHelper';
import { NamedColor } from 'quasar/dist/types/api/color';
import { formatPersonName } from 'src/utils/formatters';

const { t } = useI18n();
const { fullName, emails, role, country } = useRegistrationHelper();

const model = defineModel<Contact[]>();

const props = defineProps<{
  registrations: Registration[];
  managers: CampManager[];
}>();

const filterQuery = ref<string>('');

type ContactType =
  | 'external'
  | 'group'
  | 'participant'
  | 'counselor'
  | 'manager';

interface Contact {
  name: string;
  registrations: string;
  type: ContactType;
}

const filterFn: QSelectProps['onFilter'] = (value, done, abort) => {
  done(() => {
    filterQuery.value = value.toLowerCase();
  });
};

const filteredOptions = computed<Contact[]>(() => {
  return options.value
    .filter((contact) => {
      return (
        contact.name.toLowerCase().indexOf(filterQuery.value) > -1 ||
        contact.email.toLowerCase().indexOf(filterQuery.value) > -1
      );
    })
    .filter((contact) => {
      if (!model.value || contact.type === 'group') {
        return true;
      }

      const regex = new RegExp(`(^|;)\\s*${contact.email}\\s*(;|$)`);

      return model.value.every((value) => !regex.test(value.email));
    });
});

const options = computed<Contact[]>(() => {
  const registrationOptions = props.registrations.map(
    (registration): Partial<Contact> => {
      const roleValue = role(registration);
      const type: ContactType =
        !roleValue || roleValue === 'participant' ? 'participant' : 'counselor';

      return {
        name: formatPersonName(fullName(registration)),
        email: emails(registration).join(';'),
        type,
      };
    },
  );

  const groupOptions = createGroups(props.registrations);

  const managerOptions = props.managers.map((manager): Partial<Contact> => {
    return {
      name: manager.name ?? undefined,
      email: manager.email,
      type: 'manager',
    };
  });

  return sortItems(
    filterAndNormalizeContacts([
      ...groupOptions,
      ...registrationOptions,
      ...managerOptions,
    ]),
  );
});

const typeSortOrder: ContactType[] = [
  'group',
  'participant',
  'counselor',
  'manager',
  'external',
];
const sortItems = (items: Contact[]) => {
  return items.sort((a, b) => {
    // Compare the types based on the order in the typeOrder array
    const typeComparison =
      typeSortOrder.indexOf(a.type) - typeSortOrder.indexOf(b.type);

    // If types are the same, sort by name alphabetically
    if (typeComparison === 0) {
      return (a.name ?? a.email).localeCompare(b.name ?? b.email);
    }

    // Otherwise, sort by the type order
    return typeComparison;
  });
};

function filterAndNormalizeContacts(contacts: Partial<Contact>[]): Contact[] {
  return contacts
    .filter((value): value is Contact => value.email !== undefined)
    .map((value): Contact => {
      return {
        ...value,
        name: value.name ?? value.email,
      };
    });
}

function createGroups(registrations: Registration[]): Partial<Contact>[] {
  const dataArray = registrations.map((registration) => {
    return {
      name: fullName(registration),
      country: country(registration),
      role: role(registration),
      email: emails(registration).join(';'),
    };
  });

  const groups = dataArray.reduce(
    (groups, data) => {
      // Only use categoryA and categoryB for creating the key
      const key = JSON.stringify([data.role, data.country]);
      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(data);

      return groups;
    },
    {} as Record<string, typeof dataArray>,
  );

  return Object.entries(groups).map(([key, data]) => {
    const [role, country] = JSON.parse(key);
    return {
      name: `${role} - ${country}`,
      email: data.map((value) => value.email).join(';'),
      type: 'group',
    };
  });
}

const typeColors: Record<ContactType, NamedColor> = {
  external: 'negative',
  group: 'accent',
  participant: 'primary',
  counselor: 'secondary',
  manager: 'warning',
};

const onNewValue: QSelectProps['onNewValue'] = (email, done) => {
  if (!validateEmail(email)) {
    return;
  }

  const option: Contact = {
    name: email,
    email,
    type: 'external',
  };

  done(option);
};

// https://stackoverflow.com/a/13975255/8372579
function validateEmail(value: string) {
  const input = document.createElement('input');

  input.type = 'email';
  input.required = true;
  input.value = value;

  return typeof input.checkValidity === 'function'
    ? input.checkValidity()
    : /\S+@\S+\.\S+/.test(value);
}
</script>

<style scoped></style>

<i18n lang="yaml" locale="en">
title: 'Test'

type:
  counselor: 'Counselor'
  external: 'External'
  group: 'Group'
  manager: 'Manager'
  participant: 'Participant'
</i18n>
