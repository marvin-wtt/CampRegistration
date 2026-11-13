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
        <q-card
          v-for="group in sections"
          :key="group.id ?? 'top'"
          flat
          bordered
          class="rounded-lg overflow-hidden"
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
            <category-name-editor
              v-if="editingId === group.category.id"
              :category="group.category"
              :locales
              class="col"
              @done="editingId = null"
            />
            <template v-else>
              <span class="col text-weight-medium ellipsis">
                {{ to(group.category.name) }}
              </span>
              <q-btn
                icon="edit"
                flat
                round
                size="sm"
                :aria-label="t('finance.categories.rename')"
                @click="editingId = group.category.id"
              />
              <q-btn
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
                <category-name-editor
                  v-if="editingId === category.id"
                  :category
                  :locales
                  @done="editingId = null"
                />
                <template v-else>
                  <q-item-label>{{ to(category.name) }}</q-item-label>
                  <q-item-label caption>
                    {{
                      category.expenseCount > 0
                        ? t('finance.categories.used', category.expenseCount)
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
                  <q-btn
                    icon="arrow_upward"
                    flat
                    round
                    size="sm"
                    :disable="index === 0"
                    :aria-label="t('finance.categories.up')"
                    @click="move(group, index, -1)"
                  />
                  <q-btn
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
                <q-form
                  class="row items-start no-wrap q-gutter-x-xs"
                  @submit.prevent="createCategory(group.id)"
                >
                  <translated-input
                    v-model="newName"
                    :label="t('finance.categories.newCategory')"
                    :locales
                    :rules="[
                      (val: unknown) => !!val || t('finance.validation.name'),
                    ]"
                    class="col"
                    autofocus
                    dense
                    outlined
                    rounded
                    hide-bottom-space
                    @keydown.esc="stopAdding"
                  />
                  <q-btn
                    icon="check"
                    type="submit"
                    flat
                    round
                    color="primary"
                    :aria-label="t('finance.action.save')"
                  />
                  <q-btn
                    icon="close"
                    flat
                    round
                    :aria-label="t('finance.action.cancel')"
                    @click="stopAdding"
                  />
                </q-form>
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
          class="rounded-lg"
        >
          <q-form
            class="row items-start no-wrap q-gutter-x-xs q-pa-sm"
            @submit.prevent="createGroup"
          >
            <translated-input
              v-model="newName"
              :label="t('finance.categories.newGroup')"
              :locales
              :rules="[(val: unknown) => !!val || t('finance.validation.name')]"
              class="col"
              autofocus
              dense
              outlined
              rounded
              hide-bottom-space
              @keydown.esc="stopAdding"
            />
            <q-btn
              icon="check"
              type="submit"
              flat
              round
              color="primary"
              :aria-label="t('finance.action.save')"
            />
            <q-btn
              icon="close"
              flat
              round
              :aria-label="t('finance.action.cancel')"
              @click="stopAdding"
            />
          </q-form>
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
          <q-btn
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
                    {{ t('finance.categories.used', category.expenseCount) }}
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
import type { ExpenseCategory } from '@camp-registration/common/entities';
import ResponsiveDialog from '@/components/common/dialogs/ResponsiveDialog.vue';
import DialogCard from '@/components/common/dialogs/DialogCard.vue';
import TranslatedInput from '@/components/common/inputs/TranslatedInput.vue';
import CategoryNameEditor from '@/components/event/finances/CategoryNameEditor.vue';
import ResponsiveMenu, {
  type ResponsiveMenuItem,
} from '@/components/common/ResponsiveMenu.vue';
import { useFinanceStore } from '@/stores/finance-store';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { useObjectTranslation } from '@/composables/objectTranslation';

interface Section {
  id: string | null;
  category: ExpenseCategory | null;
  categories: ExpenseCategory[];
}

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const { t } = useI18n();
const { to } = useObjectTranslation();
const financeStore = useFinanceStore();
const { categories: storeCategories } = storeToRefs(financeStore);
const { data: event } = storeToRefs(useEventDetailsStore());

const locales = computed(() => event.value?.locales ?? []);
const editingId = ref<string | null>(null);
const showArchived = ref(false);
// The section a new category is being typed into: a group's id, `null` for
// the ungrouped ones, `false` while nothing is being added.
const addingIn = ref<string | null | false>(false);
const addingGroup = ref(false);
const newName = ref<string | Record<string, string> | undefined>(undefined);

const all = computed(() =>
  [...(storeCategories.value ?? [])].sort(
    (a, b) => a.position - b.position || a.id.localeCompare(b.id),
  ),
);
const active = computed(() => all.value.filter((c) => c.archivedAt === null));
const archived = computed(() => all.value.filter((c) => c.archivedAt !== null));

function hasChildren(category: ExpenseCategory): boolean {
  return all.value.some((c) => c.parentId === category.id);
}

/** A top-level category with children, or one created as a group. */
const groupIds = ref(new Set<string>());
function isGroup(category: ExpenseCategory): boolean {
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

function moveTargets(category: ExpenseCategory) {
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
  const lists = new Map<string | null, ExpenseCategory[]>();
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
  void financeStore.orderCategories({
    items: orderWith(
      new Map([[category.id, { parentId: category.parentId, index: target }]]),
    ),
  });
}

function regroup(category: ExpenseCategory, parentId: string | null) {
  void financeStore.orderCategories({
    items: orderWith(
      new Map([[category.id, { parentId, index: Number.MAX_SAFE_INTEGER }]]),
    ),
  });
}

function actionsFor(category: ExpenseCategory): ResponsiveMenuItem[] {
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
    category.expenseCount > 0
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

function archive(category: ExpenseCategory, value: boolean) {
  void financeStore.updateCategory(category.id, { archived: value });
}

function remove(category: ExpenseCategory) {
  void financeStore.deleteCategory(category.id);
}

function startAdding(sectionId: string | null) {
  addingGroup.value = false;
  addingIn.value = sectionId;
  newName.value = undefined;
}

function startAddingGroup() {
  addingIn.value = false;
  addingGroup.value = true;
  newName.value = undefined;
}

function stopAdding() {
  addingIn.value = false;
  addingGroup.value = false;
  newName.value = undefined;
}

async function createCategory(parentId: string | null) {
  if (!newName.value) {
    return;
  }
  try {
    await financeStore.createCategory({ name: newName.value, parentId });
    stopAdding();
  } catch {
    // Reported by the store.
  }
}

async function createGroup() {
  if (!newName.value) {
    return;
  }
  try {
    const created = await financeStore.createCategory({ name: newName.value });
    // Shown as a group although it holds no categories yet.
    groupIds.value = new Set([...groupIds.value, created.id]);
    stopAdding();
  } catch {
    // Reported by the store.
  }
}
</script>

<style scoped>
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
