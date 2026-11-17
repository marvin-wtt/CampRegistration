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
    <template #before-options>
      <q-item
        v-if="!needle.trim() || match"
        dense
      >
        <q-item-section class="text-caption text-on-surface-variant">
          {{
            match
              ? t('finance.party.alreadyKnown', { name: match.name })
              : t('finance.party.typeName')
          }}
        </q-item-section>
      </q-item>
    </template>
    <template #no-option>
      <q-item>
        <q-item-section class="text-on-surface-variant">
          {{
            needle.trim()
              ? t('finance.party.enterToAdd', {
                  name: normalizePartyName(needle),
                })
              : t('finance.party.typeName')
          }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { FinanceParties } from '@camp-registration/common/entities';
import {
  normalizePartyName,
  partyNameKey,
  pickSpelling,
} from '@camp-registration/common/utils';

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

// Compared as the match is, so a typed person always shows in the list.
const filtered = computed(() => {
  const query = partyNameKey(needle.value);
  return query
    ? options.value.filter((o) => partyNameKey(o.label).includes(query))
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

/**
 * The person the typed name already is, as the backend matches it: the one
 * manager of that name, else the name typed before.
 */
const match = computed<PartyOption | undefined>(() => {
  const key = partyNameKey(needle.value);
  if (!key) {
    return undefined;
  }
  const same = options.value.filter(
    (o) => o.name !== null && partyNameKey(o.name) === key,
  );
  const managers = same.filter((o) => o.userId);
  if (managers.length > 1) {
    return undefined;
  }
  if (managers[0]) {
    return managers[0];
  }
  const spelling = pickSpelling(same.flatMap((o) => o.name ?? []));
  return same.find((o) => o.name === spelling);
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
  const name = normalizePartyName(value);
  if (!name) {
    done();
    return;
  }
  // Handed back as an option, so the select fills the input with it and
  // closes the menu; done() alone would leave the input cleared.
  done(
    match.value ?? {
      key: `name:${name}`,
      userId: null,
      name,
      label: name,
      icon: 'badge',
    },
  );
}

function onSelect(option: PartyOption | null) {
  model.value = option
    ? { userId: option.userId, name: option.name }
    : { userId: null, name: null };
}
</script>
