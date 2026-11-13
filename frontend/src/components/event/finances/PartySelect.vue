<template>
  <q-select
    :model-value="selected"
    :options="filtered"
    :label
    option-label="label"
    option-value="key"
    use-input
    hide-selected
    fill-input
    input-debounce="0"
    new-value-mode="add-unique"
    outlined
    rounded
    hide-bottom-space
    :rules="[
      () =>
        allowFunds || selected !== null || t('finance.validation.recipient'),
    ]"
    @filter="onFilter"
    @new-value="onNewValue"
    @update:model-value="onSelect"
  >
    <template #prepend>
      <q-icon
        :name="
          selected?.userId ? 'person' : selected ? 'badge' : 'account_balance'
        "
      />
    </template>
    <template #option="{ itemProps, opt }">
      <q-item v-bind="itemProps">
        <q-item-section avatar>
          <q-icon :name="opt.icon" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ opt.label }}</q-item-label>
          <q-item-label
            v-if="opt.caption"
            caption
          >
            {{ opt.caption }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <template #no-option>
      <q-item>
        <q-item-section class="text-on-surface-variant">
          {{ t('finance.party.typeName') }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { FinanceParties } from '@camp-registration/common/entities';

export interface PartyValue {
  userId: string | null;
  name: string | null;
}

interface PartyOption extends PartyValue {
  key: string;
  label: string;
  caption?: string | undefined;
  icon: string;
}

const {
  parties,
  label = undefined,
  allowFunds = true,
} = defineProps<{
  parties: FinanceParties | undefined;
  label?: string | undefined;
  /** Whether "event funds" (no person) is a valid choice. */
  allowFunds?: boolean;
}>();

/** Both `null` means event funds. */
const model = defineModel<PartyValue>({ required: true });

const { t } = useI18n();

const needle = ref('');

const fundsOption = computed<PartyOption>(() => ({
  key: 'funds',
  userId: null,
  name: null,
  label: t('finance.eventFunds'),
  caption: t('finance.party.fundsCaption'),
  icon: 'account_balance',
}));

const options = computed<PartyOption[]>(() => {
  const managers: PartyOption[] = (parties?.managers ?? []).map((m) => ({
    key: `user:${m.userId}`,
    userId: m.userId,
    name: m.name,
    label:
      m.userId === parties?.selfUserId
        ? t('finance.party.me', { name: m.name })
        : m.name,
    caption: t(`finance.role.${m.role.toLowerCase()}`),
    icon: 'person',
  }));
  const names: PartyOption[] = (parties?.names ?? []).map((name) => ({
    key: `name:${name}`,
    userId: null,
    name,
    label: name,
    icon: 'badge',
  }));

  return [...(allowFunds ? [fundsOption.value] : []), ...managers, ...names];
});

const filtered = computed(() => {
  const query = needle.value.trim().toLocaleLowerCase();
  return query
    ? options.value.filter((o) => o.label.toLocaleLowerCase().includes(query))
    : options.value;
});

const selected = computed<PartyOption | null>(() => {
  const { userId, name } = model.value;
  if (!userId && !name) {
    return allowFunds ? fundsOption.value : null;
  }
  const known = options.value.find((o) =>
    userId ? o.userId === userId : !o.userId && o.name === name,
  );
  // A manager who has left still shows under their snapshot name.
  return (
    known ?? {
      key: userId ? `user:${userId}` : `name:${name ?? ''}`,
      userId,
      name,
      label: name ?? '',
      icon: userId ? 'person' : 'badge',
    }
  );
});

function onFilter(value: string, update: (fn: () => void) => void) {
  update(() => {
    needle.value = value;
  });
}

function onNewValue(
  value: string,
  done: (item?: PartyOption, mode?: 'add' | 'add-unique' | 'toggle') => void,
) {
  const name = value.trim();
  if (!name) {
    done();
    return;
  }
  model.value = { userId: null, name };
  done();
}

function onSelect(option: PartyOption | null) {
  model.value = option
    ? { userId: option.userId, name: option.name }
    : { userId: null, name: null };
}
</script>
