<template>
  <div class="participants-view column no-wrap">
    <!-- Header -->
    <div class="row items-center justify-between no-wrap">
      <div class="col header-text">
        <div class="row items-center no-wrap q-gutter-x-sm">
          <div class="text-h5 text-weight-medium ellipsis">
            {{ t('title') }}
          </div>
          <q-badge
            rounded
            class="count-badge"
            :label="countLabel"
          />
        </div>
        <div class="text-body2 text-grey-6 q-mt-xs gt-xs">
          {{ t('subtitle') }}
        </div>
      </div>

      <div class="col-auto row items-center no-wrap q-gutter-x-sm">
        <!-- On phones the actions shrink to icon buttons and a menu -->
        <template v-if="quasar.screen.xs">
          <q-btn
            :aria-label="t('filter.search')"
            icon="search"
            class="header-action-btn"
            :class="{ 'header-action-btn--active': mobileSearchActive }"
            flat
            round
            @click="toggleMobileSearch"
          />

          <q-btn
            v-if="countries.length > 1"
            :aria-label="t('filter.country')"
            icon="filter_list"
            class="header-action-btn"
            :class="{ 'header-action-btn--active': activeCountryCount > 0 }"
            flat
            round
            @click="filterSheetOpen = true"
          >
            <q-badge
              v-if="activeCountryCount > 0"
              rounded
              floating
              class="filter-btn-badge"
              :label="activeCountryCount"
            />
          </q-btn>

          <q-btn
            :aria-label="t('action.menu')"
            icon="more_vert"
            class="header-action-btn"
            flat
            round
          >
            <q-menu>
              <q-list style="min-width: 180px">
                <q-item
                  v-close-popup
                  clickable
                  @click="openPrintDialog"
                >
                  <q-item-section avatar>
                    <q-icon
                      name="print"
                      size="sm"
                    />
                  </q-item-section>
                  <q-item-section>
                    {{ t('action.print') }}
                  </q-item-section>
                </q-item>
                <q-item
                  v-if="canEditTemplates"
                  v-close-popup
                  clickable
                  @click="editTemplates"
                >
                  <q-item-section avatar>
                    <q-icon
                      name="edit_note"
                      size="sm"
                    />
                  </q-item-section>
                  <q-item-section>
                    {{ t('action.edit_templates') }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </template>

        <template v-else>
          <q-btn
            v-if="canEditTemplates"
            :aria-label="t('action.edit_templates')"
            icon="edit_note"
            class="header-action-btn"
            flat
            round
            @click="editTemplates"
          >
            <q-tooltip>{{ t('action.edit_templates') }}</q-tooltip>
          </q-btn>

          <m-btn
            :label="t('action.print')"
            color="primary"
            icon="print"
            @click="openPrintDialog"
          />
        </template>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar-row row items-center q-col-gutter-x-sm">
      <div class="col-12 col-sm-auto">
        <q-select
          v-model="template"
          :label="t('template')"
          :options="templateOptions"
          class="toolbar-field template-select"
          outlined
          dense
          options-dense
          map-options
          option-label="title"
          option-value="id"
          @update:model-value="onTemplateChange"
        >
          <template #prepend>
            <q-icon
              name="table_chart"
              size="20px"
            />
          </template>
          <template #selected-item="scope">
            {{ to(scope.opt.title) }}
          </template>
          <template #option="scope">
            <!-- Custom separator for plain option -->
            <q-separator v-if="scope.opt.id === '-1'" />

            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>
                  {{ to(scope.opt.title) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <div
        v-if="!quasar.screen.xs || mobileSearchOpen"
        class="col-12 col-sm"
      >
        <q-input
          ref="searchInputRef"
          v-model="searchFilter"
          :placeholder="t('filter.search')"
          class="toolbar-field search-field"
          outlined
          dense
          clearable
          debounce="200"
        >
          <template #prepend>
            <q-icon
              name="search"
              size="20px"
            />
          </template>
        </q-input>
      </div>

      <!-- Country filter chips; on phones the filter lives in a bottom sheet -->
      <div
        v-if="countries.length > 1 && !quasar.screen.xs"
        class="col-12 col-sm-auto"
      >
        <div class="row items-center q-gutter-xs">
          <q-chip
            v-for="country in countries"
            :key="country"
            clickable
            class="filter-chip"
            :class="{ 'filter-chip--active': isCountryActive(country) }"
            @click="toggleCountry(country)"
          >
            <country-icon
              :country
              class="chip-flag q-mr-xs"
            />
            {{ countryLabel(country) }}
            <q-icon
              v-if="isCountryActive(country)"
              name="check"
              size="16px"
              class="q-ml-xs"
            />
          </q-chip>
        </div>
      </div>
    </div>

    <!-- Table -->
    <q-card
      flat
      bordered
      class="table-card col"
    >
      <q-table
        v-show="rows.length > 0"
        v-model:pagination="pagination"
        :columns="displayColumns as QTableColumn[]"
        :rows
        :rows-per-page-options="[0]"
        class="participants-table absolute fit"
        flat
        hide-bottom
        row-key="id"
        virtual-scroll
        :virtual-scroll-slice-size="10"
        binary-state-sort
      >
        <template
          v-for="column in displayColumns"
          :key="column.name"
          #[`header-cell-${column.name}`]="columnProps"
        >
          <q-th
            :auto-width="column.shrink"
            :props="columnProps"
            :class="{
              'sticky-action': column.name === '_action' && !quasar.screen.xs,
            }"
            style="vertical-align: bottom"
          >
            <a
              :class="
                'headerVertical' in column && column.headerVertical
                  ? 'text-vertical'
                  : ''
              "
            >
              {{ to(columnProps.col.label) }}
            </a>
          </q-th>
        </template>

        <template #body="bodyProps">
          <q-tr
            v-touch-hold="
              (details: TouchHoldDetails) => onRowHold(details, bodyProps.row)
            "
            :props="bodyProps"
            class="participant-row cursor-pointer"
            @click="onRowClick($event, bodyProps.row)"
            @contextmenu="onRowContext($event, bodyProps.row)"
          >
            <q-td
              v-for="col in bodyProps.cols"
              :key="col.name"
              :props="bodyProps"
              :class="{
                'sticky-action': col.name === '_action' && !quasar.screen.xs,
              }"
            >
              <table-cell-wrapper
                :renderer="renderers.get(col.name)!"
                :camp
                :props="bodyCellProps(bodyProps, col)"
              />
            </q-td>
          </q-tr>
        </template>
      </q-table>

      <!-- Shared row context menu (long-press on touch, right-click on desktop).
           Anchored to a zero-size point at the cursor so that a tap anywhere
           outside the menu (but still inside the table) dismisses it. -->
      <div
        ref="menuAnchorRef"
        class="row-menu-anchor"
        :style="menuAnchorStyle"
      />
      <q-menu
        ref="rowMenuRef"
        :target="menuTarget"
        auto-close
        no-parent-event
      >
        <registration-action-list
          v-if="menuRow"
          :registration="menuRow"
        />
      </q-menu>

      <!-- Empty / no-match state -->
      <div
        v-if="rows.length === 0"
        class="absolute fit column flex-center text-center q-pa-xl"
      >
        <q-icon
          :name="registrations.length === 0 ? 'groups' : 'search_off'"
          size="56px"
          class="empty-icon"
        />
        <div class="text-subtitle1 text-weight-medium q-mt-md">
          {{
            registrations.length === 0 ? t('empty.title') : t('no_match.title')
          }}
        </div>
        <div class="text-body2 text-grey-6 q-mt-xs">
          {{
            registrations.length === 0
              ? t('empty.message')
              : t('no_match.message')
          }}
        </div>
        <m-btn
          v-if="registrations.length > 0 && hasActiveFilters"
          :label="t('action.clear_filters')"
          color="primary"
          icon="filter_list_off"
          class="q-mt-md"
          text
          @click="clearFilters"
        />
      </div>
    </q-card>

    <!-- Mobile country filter sheet -->
    <bottom-sheet v-model="filterSheetOpen">
      <div class="row items-center justify-between q-mb-sm">
        <div class="text-subtitle1 text-weight-medium">
          {{ t('filter.country') }}
        </div>
        <q-btn
          v-if="activeCountryCount > 0"
          :label="t('filter.reset')"
          color="primary"
          flat
          dense
          no-caps
          @click="countryFilter = []"
        />
      </div>

      <q-list>
        <q-item
          v-for="country in countries"
          :key="country"
          clickable
          @click="toggleCountry(country)"
        >
          <q-item-section avatar>
            <country-icon :country />
          </q-item-section>
          <q-item-section>
            {{ countryLabel(country) }}
          </q-item-section>
          <q-item-section side>
            <q-checkbox
              :model-value="isCountryActive(country)"
              class="no-pointer-events"
              dense
            />
          </q-item-section>
        </q-item>
      </q-list>
    </bottom-sheet>
  </div>
</template>

<script lang="ts" setup>
import {
  type QInput,
  type QMenu,
  type QTableColumn,
  type TouchHoldValue,
  useQuasar,
} from 'quasar';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type {
  CampDetails,
  TableTemplate,
  TableColumnTemplate,
  Registration,
} from '@camp-registration/common/entities';
import { useObjectTranslation } from 'src/composables/objectTranslation';
import { usePermissions } from 'src/composables/permissions';
import { useTemplateStore } from 'stores/template-store';
import TableTemplateIndexDialog from 'components/campManagement/table/dialogs/TableTemplateIndexDialog.vue';
import TableCellWrapper from 'components/campManagement/table/TableCellWrapper.vue';
import CountryIcon from 'components/common/localization/CountryIcon.vue';
import BottomSheet from 'components/BottomSheet.vue';
import type { QTableBodyCellProps } from 'src/types/quasar/QTableBodyCellProps';
import type { CTableColumnTemplate } from 'src/types/CTableTemplate';
import { useResultTableModel } from './useResultTableModel';
import PrintTableDialog from 'components/campManagement/table/dialogs/PrintTableDialog.vue';
import RegistrationActionList from 'components/campManagement/table/RegistrationActionList.vue';
import RegistrationRowCardDialog from 'components/campManagement/table/dialogs/RegistrationRowCardDialog.vue';
import { computed, nextTick, ref, toRef } from 'vue';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';

const { questions, registrations, templates, camp } = defineProps<{
  questions: TableColumnTemplate[];
  registrations: Registration[];
  templates: TableTemplate[];
  camp: CampDetails;
}>();

const emit = defineEmits<{
  (e: 'export', templateIds: string[]): void;
}>();

const { t, locale } = useI18n();
const quasar = useQuasar();
const route = useRoute();
const router = useRouter();
const { to } = useObjectTranslation();
const { can } = usePermissions();

const templateStore = useTemplateStore();

const {
  pagination,
  templateOptions,
  template,
  rows,
  columns,
  renderers,
  countryFilter,
  searchFilter,
  countries,
} = useResultTableModel(
  {
    questions: toRef(() => questions),
    registrations: toRef(() => registrations),
    templates: toRef(() => templates),
    camp: toRef(() => camp),
  },
  {
    // A `?template=` query param (used by dashboard deep links, including the
    // hidden attention templates) takes precedence over the `#id` hash.
    initialTemplateId:
      typeof route.query.template === 'string' &&
      route.query.template.length > 0
        ? route.query.template
        : route.hash.length > 1
          ? route.hash.substring(1)
          : null,
  },
);

const filterSheetOpen = ref<boolean>(false);

const searchInputRef = ref<QInput | null>(null);
const mobileSearchOpen = ref<boolean>(false);

const mobileSearchActive = computed<boolean>(() => {
  return mobileSearchOpen.value || (searchFilter.value?.trim().length ?? 0) > 0;
});

function toggleMobileSearch() {
  if (mobileSearchOpen.value) {
    mobileSearchOpen.value = false;
    // Closing the row also clears the query so no invisible filter remains
    searchFilter.value = '';
    return;
  }

  mobileSearchOpen.value = true;
  void nextTick(() => {
    searchInputRef.value?.focus();
  });
}

const canEditTemplates = computed<boolean>(() => {
  return (
    can('camp.table_templates.create') ||
    can('camp.table_templates.edit') ||
    can('camp.table_templates.delete')
  );
});

const countLabel = computed<string>(() => {
  const total = registrations.length;

  return rows.value.length === total
    ? String(total)
    : `${rows.value.length} / ${total}`;
});

const activeCountryCount = computed<number>(() => {
  return countryFilter.value?.length ?? 0;
});

const hasActiveFilters = computed<boolean>(() => {
  return (
    (searchFilter.value?.trim().length ?? 0) > 0 || activeCountryCount.value > 0
  );
});

const regionNames = computed(() => {
  try {
    return new Intl.DisplayNames([locale.value], { type: 'region' });
  } catch {
    return null;
  }
});

function countryLabel(country: string): string {
  const upper = country.toUpperCase();
  try {
    return regionNames.value?.of(upper) ?? upper;
  } catch {
    return upper;
  }
}

function isCountryActive(country: string): boolean {
  return countryFilter.value?.includes(country) ?? false;
}

function toggleCountry(country: string) {
  const current = countryFilter.value ?? [];
  countryFilter.value = current.includes(country)
    ? current.filter((value) => value !== country)
    : [...current, country];
}

function clearFilters() {
  searchFilter.value = '';
  countryFilter.value = [];
}

function onTemplateChange() {
  void router.replace({ hash: `#${template.value?.id}` });
}

function openPrintDialog() {
  quasar
    .dialog({
      component: PrintTableDialog,
      componentProps: {
        templates,
      },
    })
    .onOk((data: string[]) => {
      emit('export', data);
    });
}

function editTemplates() {
  quasar
    .dialog({
      component: TableTemplateIndexDialog,
      componentProps: {
        templates,
        camp,
      },
    })
    .onOk((payload: TableTemplate[]) => {
      void templateStore.updateCollection(payload);
    });
}

// --- Row interactions -------------------------------------------------------

export type TouchHoldDetails = Parameters<NonNullable<TouchHoldValue>>[0];

// Quasar augments body-slot columns with `value` at runtime; the static column
// type does not expose it, so keep these structural shapes loose.
interface BodyScope {
  row: Registration;
  rowIndex: number;
}

interface BodyCol {
  name: string;
  value?: unknown;
}

// The action column is shown on every screen size, but on phones it is no
// longer pinned to the edge (see the `sticky-action` bindings) since the sticky
// width is too costly there; it simply scrolls as a normal column.
const displayColumns = computed<CTableColumnTemplate[]>(() => columns.value);

// Whether the active template exposes row actions at all (drives the menu).
const actionsEnabled = computed<boolean>(() => {
  return columns.value.some((column) => column.name === '_action');
});

const rowMenuRef = ref<QMenu | null>(null);
const menuRow = ref<Registration | null>(null);
// A floating zero-size element placed at the cursor; the context menu anchors to
// it instead of the table card, so taps outside the menu close it as expected.
const menuAnchorRef = ref<HTMLElement | null>(null);
const menuAnchorStyle = ref<Record<string, string>>({});
const menuTarget = ref<true | HTMLElement>(true);

function eventPoint(evt: Event): { x: number; y: number } {
  const touch =
    (evt as TouchEvent).changedTouches?.[0] ?? (evt as TouchEvent).touches?.[0];
  if (touch) {
    return { x: touch.clientX, y: touch.clientY };
  }
  const mouseEvt = evt as MouseEvent;
  return { x: mouseEvt.clientX, y: mouseEvt.clientY };
}

function bodyCellProps(
  bodyProps: BodyScope,
  col: BodyCol,
): QTableBodyCellProps {
  return {
    row: bodyProps.row,
    rowIndex: bodyProps.rowIndex,
    col,
    value: col.value,
    key: col.name,
  } as unknown as QTableBodyCellProps;
}

function openRowMenu(evt: Event, row: Registration): void {
  if (!actionsEnabled.value) {
    return;
  }

  const { x, y } = eventPoint(evt);
  menuAnchorStyle.value = {
    position: 'fixed',
    left: `${x}px`,
    top: `${y}px`,
  };
  menuRow.value = row;
  if (menuAnchorRef.value) {
    menuTarget.value = menuAnchorRef.value;
  }

  // Let the anchor reposition (and the target watcher re-resolve) before showing.
  void nextTick(() => rowMenuRef.value?.show());
}

function onRowHold(details: TouchHoldDetails, row: Registration): void {
  if (!details.evt) {
    return;
  }

  // touch-hold already cancels itself once the finger moves (i.e. scrolls).
  openRowMenu(details.evt, row);
}

function onRowContext(evt: MouseEvent, row: Registration): void {
  // Suppress the native context menu everywhere; on touch the long-press is
  // handled by touch-hold so we only open the menu for real mouse right-clicks.
  evt.preventDefault();
  if (quasar.platform.is.mobile) {
    return;
  }
  openRowMenu(evt, row);
}

function onRowClick(evt: MouseEvent, row: Registration): void {
  // Let interactive cell content (links, buttons, inputs) handle their own taps.
  const target = evt.target as HTMLElement | null;
  if (target?.closest('a, button, input, .q-btn, [role="button"]')) {
    return;
  }

  // On larger screens every column is already visible, so a click just opens
  // the action menu at the cursor. On phones the table is condensed, so a tap
  // opens the full row card instead.
  if (!quasar.screen.xs) {
    openRowMenu(evt, row);
    return;
  }

  quasar.dialog({
    component: RegistrationRowCardDialog,
    componentProps: {
      registration: row,
      columns: columns.value,
      renderers: renderers.value,
      camp,
    },
  });
}
</script>

<style lang="scss" scoped>
.participants-view {
  padding: 16px;
}

@media (min-width: 600px) {
  .participants-view {
    padding: 24px;
  }
}

.count-badge {
  min-width: 20px;
  padding: 2px 8px;
  justify-content: center;

  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);

  font-size: 12px;
  font-weight: 600;
}

.header-text {
  min-width: 0;
}

.header-action-btn {
  color: var(--md3-on-surface-variant);
}

.header-action-btn--active {
  color: var(--md3-primary);
}

.toolbar-row {
  margin-top: 16px;
  margin-bottom: 16px;
  row-gap: 8px;
}

.toolbar-field :deep(.q-field__control) {
  border-radius: 12px;
}

.template-select {
  min-width: 220px;
}

.search-field {
  max-width: 360px;
}

.filter-chip {
  height: 32px;
  margin: 0;
  padding: 0 12px;
  border: 1px solid var(--md3-outline-variant);
  border-radius: 8px;

  background: transparent;
  color: var(--md3-on-surface-variant);

  font-size: 13px;
  font-weight: 500;
}

.filter-chip--active {
  border-color: transparent;
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
}

.chip-flag {
  width: 18px;
}

.filter-btn-badge {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
}

.table-card {
  position: relative;
  min-height: 0;
  border-radius: 16px;
  background: var(--md3-surface);
  overflow: hidden;
}

.participants-table {
  background: transparent;

  :deep(thead tr th) {
    position: sticky;
    top: 0;
    z-index: 1;

    background: var(--md3-surface);
    color: var(--md3-on-surface-variant);
    font-weight: 600;
  }

  :deep(tbody td) {
    height: 36px;
    padding-top: 2px;
    padding-bottom: 2px;
  }

  :deep(tbody tr:hover td) {
    background: var(--md3-surface-container);
  }

  // Keep the actions column reachable without scrolling on wide tables
  :deep(th.sticky-action),
  :deep(td.sticky-action) {
    position: sticky;
    right: 0;
    z-index: 1;
    background: var(--md3-surface);
    border-left: 1px solid var(--md3-outline-variant);
  }

  // The corner cell must stay above both sticky axes
  :deep(thead tr th.sticky-action) {
    z-index: 2;
  }
}

.row-menu-anchor {
  position: fixed;
  width: 0;
  height: 0;
  pointer-events: none;
}

.text-vertical {
  vertical-align: bottom;
  writing-mode: vertical-rl;
  transform: rotate(-180deg);
}

.empty-icon {
  color: var(--md3-on-surface-variant);
  opacity: 0.6;
}

@media (max-width: 599px) {
  .participants-view {
    padding: 12px;
  }

  .toolbar-row {
    margin-top: 8px;
    margin-bottom: 12px;
  }

  .search-field {
    max-width: none;
  }

  .template-select {
    min-width: 0;
  }
}
</style>

<i18n lang="yaml" locale="en">
template: 'Template'
title: 'Participants'
subtitle: 'Browse, filter, and print the registrations of this camp.'

action:
  print: 'Print'
  edit_templates: 'Edit templates'
  clear_filters: 'Clear filters'
  menu: 'Actions'

filter:
  country: 'Country'
  search: 'Search participants'
  reset: 'Reset'

empty:
  title: 'No participants yet'
  message: 'Registrations will show up here as soon as they are submitted.'

no_match:
  title: 'No matching participants'
  message: 'Try adjusting the search or filters.'
</i18n>

<i18n lang="yaml" locale="de">
template: 'Vorlage'
title: 'Teilnehmende'
subtitle: 'Durchsuchen, filtern und drucken Sie die Anmeldungen dieses Camps.'

action:
  print: 'Drucken'
  edit_templates: 'Vorlagen bearbeiten'
  clear_filters: 'Filter zurücksetzen'
  menu: 'Aktionen'

filter:
  country: 'Land'
  search: 'Teilnehmende suchen'
  reset: 'Zurücksetzen'

empty:
  title: 'Noch keine Teilnehmenden'
  message: 'Anmeldungen erscheinen hier, sobald sie eingereicht wurden.'

no_match:
  title: 'Keine passenden Teilnehmenden'
  message: 'Passen Sie die Suche oder die Filter an.'
</i18n>

<i18n lang="yaml" locale="fr">
template: 'Modèle'
title: 'Participants'
subtitle: 'Parcourez, filtrez et imprimez les inscriptions de ce camp.'

action:
  print: 'Imprimer'
  edit_templates: 'Modifier les modèles'
  clear_filters: 'Effacer les filtres'
  menu: 'Actions'

filter:
  country: 'Pays'
  search: 'Rechercher des participants'
  reset: 'Réinitialiser'

empty:
  title: 'Aucun participant pour le moment'
  message: 'Les inscriptions apparaîtront ici dès qu’elles seront soumises.'

no_match:
  title: 'Aucun participant correspondant'
  message: 'Essayez d’ajuster la recherche ou les filtres.'
</i18n>

<i18n lang="yaml" locale="pl">
template: 'Szablon'
title: 'Uczestnicy'
subtitle: 'Przeglądaj, filtruj i drukuj zgłoszenia tego obozu.'

action:
  print: 'Drukuj'
  edit_templates: 'Edytuj szablony'
  clear_filters: 'Wyczyść filtry'
  menu: 'Akcje'

filter:
  country: 'Kraj'
  search: 'Szukaj uczestników'
  reset: 'Resetuj'

empty:
  title: 'Brak uczestników'
  message: 'Zgłoszenia pojawią się tutaj po ich przesłaniu.'

no_match:
  title: 'Brak pasujących uczestników'
  message: 'Spróbuj zmienić wyszukiwanie lub filtry.'
</i18n>

<i18n lang="yaml" locale="cs">
template: 'Šablona'
title: 'Účastníci'
subtitle: 'Procházejte, filtrujte a tiskněte přihlášky tohoto tábora.'

action:
  print: 'Tisk'
  edit_templates: 'Upravit šablony'
  clear_filters: 'Zrušit filtry'
  menu: 'Akce'

filter:
  country: 'Země'
  search: 'Hledat účastníky'
  reset: 'Obnovit'

empty:
  title: 'Zatím žádní účastníci'
  message: 'Přihlášky se zde zobrazí, jakmile budou odeslány.'

no_match:
  title: 'Žádní odpovídající účastníci'
  message: 'Zkuste upravit vyhledávání nebo filtry.'
</i18n>
