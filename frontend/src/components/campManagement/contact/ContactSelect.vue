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
          :color="typeColors[scope.opt.type as Contact['type']]"
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
import { QSelectProps } from 'quasar';
import { CampManager, Registration } from '@camp-registration/common/entities';
import { computed, ref, watch } from 'vue';
import { useRegistrationHelper } from 'src/composables/registrationHelper';
import { NamedColor } from 'quasar/dist/types/api/color';
import { formatPersonName } from 'src/utils/formatters';
import { Contact } from 'components/campManagement/contact/Contact';

const { t } = useI18n();
const { fullName, role, country } = useRegistrationHelper();

const model = defineModel<Contact[]>({
  required: true,
});

const props = defineProps<{
  registrations: Registration[];
  managers: CampManager[];
}>();

watch(model, (value) => {
  // TODO Check for duplicates and remove

  const inGroupIds = value
    .filter((contact) => contact.type === 'group')
    .map((value1) => value1.registrations.flatMap((contact) => contact.id));

  // TODO This is not the right place to update...
});

const filterQuery = ref<string>('');

const filterFn: QSelectProps['onFilter'] = (value, done, abort) => {
  done(() => {
    filterQuery.value = value.toLowerCase();
  });
};

const filteredOptions = computed<Contact[]>(() => {
  return options.value
    .filter((contact) => {
      return contact.name.toLowerCase().indexOf(filterQuery.value) > -1;
    })
    .filter((contact) => {
      if (!model.value) {
        return true;
      }

      if (contact.type !== 'participant' && contact.type !== 'counselor') {
        return true;
      }

      // Only groups contain multiple registrations

      return model.value.every((value) => {
        if (value.type === 'counselor' || value.type === 'participant') {
          return value.registration.id !== contact.registration.id;
        }

        if (value.type === 'group') {
          return value.registrations.every(
            (value1) => value1.id !== contact.registration.id,
          );
        }

        return true;
      });
    });
});

const options = computed<Contact[]>(() => {
  const registrationOptions = props.registrations.map(
    (registration): Contact => {
      const roleValue = role(registration);
      const type =
        !roleValue || roleValue === 'participant' ? 'participant' : 'counselor';

      return {
        name: formatPersonName(fullName(registration)),
        registration,
        type,
      };
    },
  );

  const groupOptions = createGroups(props.registrations);

  const managerOptions = props.managers.map((manager): Contact => {
    return {
      name: manager.name ?? manager.email,
      email: manager.email,
      type: 'manager',
    };
  });

  return sortItems([
    ...groupOptions,
    ...registrationOptions,
    ...managerOptions,
  ]);
});

const typeSortOrder: Contact['type'][] = [
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
      return a.name.localeCompare(b.name);
    }

    // Otherwise, sort by the type order
    return typeComparison;
  });
};

function createGroups(registrations: Registration[]): Contact[] {
  const dataArray = registrations.map((registration) => {
    return {
      name: fullName(registration),
      country: country(registration),
      role: role(registration),
      registration,
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
      registrations: data.map((data) => data.registration),
      type: 'group',
    };
  });
}

const typeColors: Record<Contact['type'], NamedColor> = {
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
