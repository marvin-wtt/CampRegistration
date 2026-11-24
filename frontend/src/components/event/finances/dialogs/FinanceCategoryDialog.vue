<template>
  <responsive-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <dialog-card
      :title="t('finance.categories.title')"
      :subtitle="t('finance.categories.subtitle')"
      icon="category"
      :width="640"
      no-form
      @cancel="onDialogOK"
    >
      <div class="column no-wrap q-gutter-y-md">
        <!-- Expense and income categories are lists of their own. -->
        <m-btn-group
          connected
          class="kind-switch"
          data-test="category-kind"
        >
          <m-btn
            v-for="option in KINDS"
            :key="option.value"
            class="q-btn--toggle"
            :class="{ 'q-btn--selected': listKind === option.value }"
            :aria-pressed="listKind === option.value"
            :label="t(option.label)"
            :icon="option.icon"
            primary
            no-caps
            :data-test="`category-kind-${option.value}`"
            @click="switchKind(option.value)"
          />
        </m-btn-group>
        <q-card
          v-for="group in sections"
          :key="group.id ?? 'top'"
          flat
          bordered
          class="section-card rounded-lg overflow-hidden"
        >
          <!-- Next to groups, the ungrouped categories say so. -->
          <div
            v-if="!group.category && sections.length > 1"
            class="group-header group-header--none row items-center no-wrap q-px-md q-py-xs"
          >
            <q-icon
              name="label_off"
              class="q-mr-sm"
            />
            <span class="text-weight-medium">
              {{ t('finance.categories.ungrouped') }}
            </span>
          </div>
          <div
            v-else-if="group.category"
            class="group-header row items-center no-wrap q-pl-md q-pr-xs q-py-xs"
          >
            <q-icon
              name="folder"
              class="q-mr-sm"
            />
            <category-name-form
              v-if="editingId === group.category.id"
              :label="t('finance.categories.name')"
              :locales
              :initial="group.category.name"
              :save="renameOf(group.category)"
              class="col"
              @saved="editingId = null"
              @cancel="editingId = null"
            />
            <template v-else>
              <span class="col text-weight-medium ellipsis">
                {{ to(group.category.name) }}
              </span>
              <m-btn
                color="on-surface-variant"
                icon="edit"
                flat
                round
                size="sm"
                :aria-label="t('finance.categories.rename')"
                @click="editingId = group.category.id"
              />
              <m-btn
                color="on-surface-variant"
                v-if="group.categories.length === 0"
                icon="delete"
                flat
                round
                size="sm"
                :aria-label="t('finance.action.delete')"
                @click="remove(group.category)"
              />
            </template>
          </div>

          <q-list separator>
            <q-item
              v-for="(category, index) in group.categories"
              :key="category.id"
              class="category-item"
            >
              <q-item-section>
                <category-name-form
                  v-if="editingId === category.id"
                  :label="t('finance.categories.name')"
                  :locales
                  :initial="category.name"
                  :save="renameOf(category)"
                  @saved="editingId = null"
                  @cancel="editingId = null"
                />
                <template v-else>
                  <q-item-label>{{ to(category.name) }}</q-item-label>
                  <q-item-label caption>
                    {{
                      category.recordCount > 0
                        ? t(
                            listKind === 'INCOME'
                              ? 'finance.categories.usedIncome'
                              : 'finance.categories.used',
                            category.recordCount,
                          )
                        : t('finance.categories.unused')
                    }}
                  </q-item-label>
                </template>
              </q-item-section>
              <q-item-section
                v-if="editingId !== category.id"
                side
              >
                <div class="row no-wrap items-center">
                  <m-btn
                    color="on-surface-variant"
                    icon="arrow_upward"
                    flat
                    round
                    size="sm"
                    :disable="index === 0"
                    :aria-label="t('finance.categories.up')"
                    @click="move(group, index, -1)"
                  />
                  <m-btn
                    color="on-surface-variant"
                    icon="arrow_downward"
                    flat
                    round
                    size="sm"
                    :disable="index === group.categories.length - 1"
                    :aria-label="t('finance.categories.down')"
                    @click="move(group, index, 1)"
                  />
                  <responsive-menu
                    :items="actionsFor(category)"
                    :label="t('finance.categories.more')"
                    :title="to(category.name)"
                    size="sm"
                  />
                </div>
              </q-item-section>
            </q-item>

            <!-- New category, right where it will live -->
            <q-item v-if="addingIn === group.id">
              <q-item-section>
                <category-name-form
                  :label="t('finance.categories.newCategory')"
                  :locales
                  :save="(name) => createCategory(group.id, name)"
                  @saved="stopAdding"
                  @cancel="stopAdding"
                />
              </q-item-section>
            </q-item>
            <q-item
              v-else
              clickable
              class="add-item text-primary"
              data-test="category-add"
              @click="startAdding(group.id)"
            >
              <q-item-section avatar>
                <q-icon name="add" />
              </q-item-section>
              <q-item-section>
                {{ t('finance.categories.addCategory') }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- New group -->
        <q-card
          v-if="addingGroup"
          flat
          bordered
          class="section-card rounded-lg"
        >
          <category-name-form
            :label="t('finance.categories.newGroup')"
            :locales
            :save="createGroup"
            class="q-pa-sm"
            @saved="stopAdding"
            @cancel="stopAdding"
          />
        </q-card>
        <m-btn
          v-else
          :label="t('finance.categories.addGroup')"
          icon="create_new_folder"
          text
          class="self-start"
          data-test="category-add-group"
          @click="startAddingGroup"
        />

        <!-- Archived -->
        <div v-if="archived.length > 0">
          <m-btn
            color="on-surface-variant"
            :label="
              t('finance.categories.showArchived', { count: archived.length })
            "
            :icon-right="showArchived ? 'expand_less' : 'expand_more'"
            flat
            rounded
            no-caps
            text-color="on-surface-variant"
            @click="showArchived = !showArchived"
          />
          <q-slide-transition>
            <q-list
              v-show="showArchived"
              separator
              bordered
              class="rounded-lg q-mt-sm"
            >
              <q-item
                v-for="category in archived"
                :key="category.id"
              >
                <q-item-section>
                  <q-item-label class="text-on-surface-variant">
                    {{ to(category.name) }}
                  </q-item-label>
                  <q-item-label caption>
                    {{
                      t(
                        listKind === 'INCOME'
                          ? 'finance.categories.usedIncome'
                          : 'finance.categories.used',
                        category.recordCount,
                      )
                    }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <m-btn
                    :label="t('finance.categories.restore')"
                    icon="unarchive"
                    text
                    @click="archive(category, false)"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-slide-transition>
        </div>
      </div>

      <template #actions>
        <m-btn
          :label="t('finance.action.done')"
          color="primary"
          @click="onDialogOK"
        />
      </template>
    </dialog-card>
  </responsive-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';
import { MBtn } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtn';
import { MBtnGroup } from '@anoyomoose/q2-fresh-paint-md3e/components/Md3eBtnGroup';
import type {
  FinanceCategory,
  FinanceCategoryKind,
} from '@camp-registration/common/entities';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import CategoryNameForm from '@/components/event/finances/CategoryNameForm.vue';
import ResponsiveMenu, {
  type ResponsiveMenuItem,
} from '@/components/common/ResponsiveMenu.vue';
import { useFinanceStore } from '@/stores/finance-store';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useObjectTranslation } from '@/composables/objectTranslation';

interface Section {
  id: string | null;
  category: FinanceCategory | null;
  categories: FinanceCategory[];
}

const { kind: initialKind = 'EXPENSE' } = defineProps<{
  /** The list the dialog opens on; it can switch to the other. */
  kind?: FinanceCategoryKind;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const { t } = useI18n();
const { to } = useObjectTranslation();
const financeStore = useFinanceStore();
const { categories: expenseCategories, incomeCategories } =
  storeToRefs(financeStore);
const KINDS = [
  {
    value: 'EXPENSE',
    label: 'finance.categories.expenses',
    icon: 'receipt_long',
  },
  { value: 'INCOME', label: 'finance.categories.income', icon: 'savings' },
] as const;
const listKind = ref<FinanceCategoryKind>(initialKind);
const storeCategories = computed(() =>
  listKind.value === 'INCOME'
    ? incomeCategories.value
    : expenseCategories.value,
);
const { data: event } = storeToRefs(useEventDetailsStore());

const locales = computed(() => event.value?.locales ?? []);
const editingId = ref<string | null>(null);
const showArchived = ref(false);
// The section a new category is being typed into: a group's id, `null` for
// the ungrouped ones, `false` while nothing is being added.
const addingIn = ref<string | null | false>(false);
const addingGroup = ref(false);

// Half-typed edits belong to the list they were started in.
function switchKind(value: FinanceCategoryKind) {
  listKind.value = value;
  editingId.value = null;
  addingIn.value = false;
  addingGroup.value = false;
  if (value === 'INCOME') {
    void financeStore.loadIncomeCategories();
  }
}
if (initialKind === 'INCOME') {
  void financeStore.loadIncomeCategories();
}

const all = computed(() =>
  [...(storeCategories.value ?? [])].sort(
    (a, b) => a.position - b.position || a.id.localeCompare(b.id),
  ),
);
const active = computed(() => all.value.filter((c) => c.archivedAt === null));
const archived = computed(() => all.value.filter((c) => c.archivedAt !== null));

function hasChildren(category: FinanceCategory): boolean {
  return all.value.some((c) => c.parentId === category.id);
}

/** A top-level category with children, or one created as a group. */
const groupIds = ref(new Set<string>());
function isGroup(category: FinanceCategory): boolean {
  return (
    category.parentId === null &&
    (hasChildren(category) || groupIds.value.has(category.id))
  );
}

// Ungrouped categories first, then each group with its categories.
const sections = computed<Section[]>(() => [
  {
    id: null,
    category: null,
    categories: active.value.filter((c) => c.parentId === null && !isGroup(c)),
  },
  ...active.value
    .filter((c) => isGroup(c))
    .map((group) => ({
      id: group.id,
      category: group,
      categories: active.value.filter((c) => c.parentId === group.id),
    })),
]);

function moveTargets(category: FinanceCategory) {
  const targets: { id: string | null; label: string }[] = [];
  if (category.parentId !== null) {
    targets.push({ id: null, label: t('finance.categories.noGroup') });
  }
  // A category with expenses can be moved into a group; it can't become one.
  for (const section of sections.value) {
    if (section.category && section.id !== category.parentId) {
      targets.push({ id: section.id, label: to(section.category.name) });
    }
  }
  return targets;
}

/** The whole tree's order, with `changes` applied, as the API takes it. */
function orderWith(
  changes: Map<string, { parentId: string | null; index: number }>,
) {
  const lists = new Map<string | null, FinanceCategory[]>();
  for (const category of all.value) {
    const parentId = changes.get(category.id)?.parentId ?? category.parentId;
    lists.set(parentId, [...(lists.get(parentId) ?? []), category]);
  }

  const items: { id: string; parentId: string | null; position: number }[] = [];
  for (const [parentId, list] of lists) {
    const ordered = [...list];
    for (const [id, change] of changes) {
      const from = ordered.findIndex((c) => c.id === id);
      if (from >= 0 && change.parentId === parentId) {
        const [moved] = ordered.splice(from, 1);
        if (moved) {
          ordered.splice(Math.min(change.index, ordered.length), 0, moved);
        }
      }
    }
    ordered.forEach((category, position) =>
      items.push({ id: category.id, parentId, position }),
    );
  }
  return items;
}

function move(section: Section, index: number, delta: number) {
  const category = section.categories[index];
  const neighbour = section.categories[index + delta];
  if (!category || !neighbour) {
    return;
  }
  const siblings = all.value.filter((c) => c.parentId === category.parentId);
  const target = siblings.findIndex((c) => c.id === neighbour.id);
  void financeStore.orderCategories(
    {
      items: orderWith(
        new Map([
          [category.id, { parentId: category.parentId, index: target }],
        ]),
      ),
    },
    listKind.value,
  );
}

function regroup(category: FinanceCategory, parentId: string | null) {
  void financeStore.orderCategories(
    {
      items: orderWith(
        new Map([[category.id, { parentId, index: Number.MAX_SAFE_INTEGER }]]),
      ),
    },
    listKind.value,
  );
}

function actionsFor(category: FinanceCategory): ResponsiveMenuItem[] {
  return [
    {
      label: t('finance.categories.rename'),
      icon: 'edit',
      onClick: () => (editingId.value = category.id),
    },
    ...moveTargets(category).map((target) => ({
      label: t('finance.categories.moveTo', { group: target.label }),
      icon: 'drive_file_move',
      onClick: () => regroup(category, target.id),
    })),
    category.recordCount > 0
      ? {
          label: t('finance.categories.archive'),
          icon: 'archive',
          onClick: () => archive(category, true),
        }
      : {
          label: t('finance.action.delete'),
          icon: 'delete',
          color: 'negative',
          hidden: hasChildren(category),
          onClick: () => remove(category),
        },
  ];
}

function archive(category: FinanceCategory, value: boolean) {
  void financeStore.updateCategory(
    category.id,
    { archived: value },
    listKind.value,
  );
}

function remove(category: FinanceCategory) {
  void financeStore.deleteCategory(category.id, listKind.value);
}

function startAdding(sectionId: string | null) {
  addingGroup.value = false;
  addingIn.value = sectionId;
}

function startAddingGroup() {
  addingIn.value = false;
  addingGroup.value = true;
}

function stopAdding() {
  addingIn.value = false;
  addingGroup.value = false;
}

type CategoryName = string | Record<string, string>;

function renameOf(category: FinanceCategory) {
  return (name: CategoryName) =>
    financeStore.updateCategory(category.id, { name }, listKind.value);
}

function createCategory(parentId: string | null, name: CategoryName) {
  return financeStore.createCategory({ name, parentId }, listKind.value);
}

async function createGroup(name: CategoryName) {
  const created = await financeStore.createCategory({ name }, listKind.value);
  // Shown as a group although it holds no categories yet.
  groupIds.value = new Set([...groupIds.value, created.id]);
}
</script>

<style scoped>
.kind-switch {
  display: flex;
}

.kind-switch > :deep(.q-btn) {
  flex: 1 1 0;
  min-width: 0;
}

/* On the dialog's own surface, outlined: a card's darker fill would read as
   a hole in the dialog. */
.section-card {
  background: transparent;
}

.group-header {
  background: var(--md3-secondary-container);
  color: var(--md3-on-secondary-container);
  min-height: 48px;
}

/* Same shape as a group's header, but plainly not a group. */
.group-header--none {
  background: var(--md3-surface-container-high);
  color: var(--md3-on-surface-variant);
}

.category-item,
.add-item {
  min-height: 56px;
}
</style>
