<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('title')"
      :subtitle="t('message')"
      :width="480"
      @submit="onOKClick"
      @cancel="onDialogCancel"
    >
      <q-option-group
        v-model="model"
        :options
        type="checkbox"
        color="primary"
      />

      <!-- Collapsed, but the caption always says which countries print. -->
      <q-list
        v-if="multiGroup"
        bordered
        class="rounded-borders q-mt-md"
      >
        <q-expansion-item
          icon="filter_list"
          :label="t('groups.label')"
          :caption="groupSummary"
          data-test="print-groups"
        >
          <div class="row q-gutter-sm q-pa-md">
            <q-chip
              v-for="group in groups"
              :key="group"
              clickable
              :outline="!isGroupActive(group)"
              :color="isGroupActive(group) ? 'secondary-container' : undefined"
              :text-color="
                isGroupActive(group)
                  ? 'on-secondary-container'
                  : 'on-surface-variant'
              "
              :data-test="`print-group-${group}`"
              @click="toggleGroup(group)"
            >
              <country-icon
                :country="group"
                class="chip-flag q-mr-xs"
              />
              {{ countryName(group, locale) }}
              <q-icon
                v-if="isGroupActive(group)"
                name="check"
                size="16px"
                class="q-ml-xs"
              />
            </q-chip>
          </div>
        </q-expansion-item>
      </q-list>

      <template #actions>
        <q-btn
          type="reset"
          :label="t('action.cancel')"
          color="primary"
          rounded
          outline
        />
        <q-btn
          type="submit"
          :label="t('action.ok')"
          :disable="model.length === 0"
          color="primary"
          rounded
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar';
import type { TableTemplate } from '@camp-registration/common/entities';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { useObjectTranslation } from '@/composables/objectTranslation';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import type { PrintTablesSelection } from '@/components/event/table/PrintTablesPayload';
import CountryIcon from '@/components/common/localization/CountryIcon.vue';
import { countryName } from '@/utils/countries';

type SimpleTableTemplate = Pick<TableTemplate, 'title' | 'id' | 'order'>;

const {
  templates,
  defaultTemplateId,
  groups = [],
  defaultGroups = [],
} = defineProps<{
  templates: SimpleTableTemplate[];
  defaultTemplateId?: string | undefined;
  groups?: string[];
  // The table's active group filter; none active means every group.
  defaultGroups?: string[] | undefined;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { t, locale } = useI18n();
const { to } = useObjectTranslation();

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const model = ref<string[]>(defaultTemplateId ? [defaultTemplateId] : []);

const options = computed(() =>
  templates.map((template) => ({
    label: to(template.title),
    value: template.id,
  })),
);

const multiGroup = groups.length > 1;

// Like the table's filter chips: none active prints every group.
const groupModel = ref<string[]>(
  defaultGroups.filter((group) => groups.includes(group)),
);

// Every group active is no filter at all, so the printout isn't labelled.
const selectedGroups = computed<string[]>(() =>
  groupModel.value.length < groups.length ? groupModel.value : [],
);

const groupSummary = computed<string>(() =>
  selectedGroups.value.length > 0
    ? selectedGroups.value
        .map((group) => countryName(group, locale.value))
        .join(', ')
    : t('groups.all'),
);

function isGroupActive(group: string): boolean {
  return groupModel.value.includes(group);
}

function toggleGroup(group: string) {
  groupModel.value = isGroupActive(group)
    ? groupModel.value.filter((value) => value !== group)
    : [...groupModel.value, group];
}

function onOKClick() {
  const selection: PrintTablesSelection = {
    templateIds: model.value,
    groups: selectedGroups.value,
  };
  onDialogOK(selection);
}
</script>

<style scoped>
.chip-flag {
  width: 18px;
}
</style>

<i18n lang="yaml" locale="en">
title: 'Print Table'
message: 'Select the tables you want to print:'
groups:
  label: 'Countries'
  all: 'All countries'

action:
  ok: 'Print'
  cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
title: 'Tabelle drucken'
message: 'Wähle die Tabellen aus, die du drucken möchtest:'
groups:
  label: 'Länder'
  all: 'Alle Länder'

action:
  ok: 'Drucken'
  cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
title: 'Imprimer le tableau'
message: 'Sélectionnez les tableaux que vous souhaitez imprimer :'
groups:
  label: 'Pays'
  all: 'Tous les pays'

action:
  ok: 'Imprimer'
  cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
title: 'Drukuj tabelę'
message: 'Wybierz tabele, które chcesz wydrukować:'
groups:
  label: 'Kraje'
  all: 'Wszystkie kraje'

action:
  ok: 'Drukuj'
  cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
title: 'Tisk tabulky'
message: 'Vyberte tabulky, které chcete vytisknout:'
groups:
  label: 'Země'
  all: 'Všechny země'

action:
  ok: 'Tisknout'
  cancel: 'Zrušit'
</i18n>
