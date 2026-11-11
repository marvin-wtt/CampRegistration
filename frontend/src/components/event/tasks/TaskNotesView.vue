<template>
  <div
    class="notes-view task-notes-content"
    :class="{
      'notes-view--editable': editable,
      'notes-view--editing': editing,
      'notes-view--static': !editable,
    }"
    :tabindex="editable && !editing ? 0 : undefined"
    :role="editable && !editing ? 'button' : undefined"
    :aria-label="editable && !editing ? t('edit') : undefined"
    data-test="task-notes-view"
    @click="onClick"
    @change="onChange"
    @keydown.enter.self.prevent="startEditing()"
  >
    <editor-content
      v-if="editor"
      :editor
      class="notes-view__content"
    />
    <task-notes-toolbar
      v-if="editor && editing"
      :editor
      class="notes-view__toolbar"
    />
    <q-icon
      v-else-if="editable"
      name="edit"
      size="16px"
      class="notes-view__hint"
    />
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import Placeholder from '@tiptap/extension-placeholder';
import {
  applyReadOnlyCheck,
  taskNotesExtensions,
  useNotesModel,
} from '@/components/event/tasks/taskNotesEditor';
import TaskNotesToolbar from '@/components/event/tasks/TaskNotesToolbar.vue';

// Rendered notes. With `editable`, checklist items tick in place and a click
// on the text turns the same editor instance editable — switching instances
// would lose the tap, and with it the iOS keyboard and the click position.
const { editable = false } = defineProps<{
  editable?: boolean;
}>();

const modelValue = defineModel<string>({ default: '' });

const emit = defineEmits<{
  focus: [];
  blur: [];
}>();

const { t } = useI18n();

const editing = ref<boolean>(false);

const editor = useEditor({
  extensions: [
    ...taskNotesExtensions(
      (item) => t('checkboxLabel', { item }),
      () => editable,
    ),
    Placeholder.configure({
      placeholder: () => (editable ? t('placeholder') : ''),
      showOnlyWhenEditable: false,
    }),
  ],
  content: modelValue.value,
  contentType: 'markdown',
  editable: false,
  onUpdate: ({ editor }) => onEditorUpdate(editor),
  onBlur: () => stopEditing(),
});

// Typing owns the content; outside changes wait until editing stops.
const { onUpdate: onEditorUpdate, sync } = useNotesModel(
  editor,
  modelValue,
  () => !editing.value,
);

function startEditing(event?: MouseEvent) {
  const instance = editor.value;
  if (!editable || !instance || editing.value) {
    return;
  }

  editing.value = true;
  instance.setEditable(true, false);

  const position = event
    ? instance.view.posAtCoords({ left: event.clientX, top: event.clientY })
    : null;
  instance.commands.focus(position?.pos ?? 'end');
  emit('focus');
}

function stopEditing() {
  if (!editing.value) {
    return;
  }
  editing.value = false;
  editor.value?.setEditable(false, false);
  sync();
  emit('blur');
}

// Links open and checkboxes tick without entering edit mode.
function onClick(event: MouseEvent) {
  if (!(event.target as Element).closest('a, label, input')) {
    startEditing(event);
  }
}

// Runs after TipTap's own checkbox handler, which bubbles up to here.
function onChange(event: Event) {
  const target = event.target as HTMLElement;
  if (editable && editor.value && target instanceof HTMLInputElement) {
    applyReadOnlyCheck(editor.value, target);
  }
}

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style src="./taskNotesContent.css"></style>

<style scoped>
.notes-view {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  outline: 2px solid transparent;
  background: var(--md3-surface-container-highest);
  font-size: 14px;
  line-height: 1.5;
  transition:
    background-color 150ms ease,
    outline-color 150ms ease;
}

.notes-view--editable:not(.notes-view--editing) {
  cursor: text;
}

/* MD3 hover state layer: 8% on-surface over the container. */
.notes-view--editable:not(.notes-view--editing):hover {
  background: color-mix(
    in srgb,
    var(--md3-on-surface) 8%,
    var(--md3-surface-container-highest)
  );
}

.notes-view--editing,
.notes-view:focus-visible {
  outline-color: var(--md3-primary);
}

.notes-view__content {
  flex: 1;
  min-width: 0;
}

/* Buttons are taller than a text line; let them overhang the padding. */
.notes-view__toolbar {
  margin: -6px -8px -6px 0;
}

.notes-view__hint {
  flex: 0 0 auto;
  margin-top: 2px;
  color: var(--md3-on-surface-variant);
  opacity: 0;
  transition: opacity 150ms ease;
}

.notes-view:hover .notes-view__hint,
.notes-view:focus-visible .notes-view__hint {
  opacity: 1;
}

/* No hover on touch screens: keep the hint faintly visible instead. */
@media (hover: none) {
  .notes-view__hint {
    opacity: 0.6;
  }
}

.notes-view__content :deep(p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
  color: var(--md3-on-surface-variant);
}

.notes-view--static :deep(input[type='checkbox']) {
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .notes-view,
  .notes-view__hint {
    transition: none;
  }
}
</style>

<i18n lang="yaml" locale="en">
placeholder: 'Add details, a list or a checklist…'
checkboxLabel: 'Checklist item: {item}'
edit: 'Edit details'
</i18n>

<i18n lang="yaml" locale="de">
placeholder: 'Details, eine Liste oder eine Checkliste hinzufügen…'
checkboxLabel: 'Checklisten-Punkt: {item}'
edit: 'Details bearbeiten'
</i18n>

<i18n lang="yaml" locale="fr">
placeholder: 'Ajoute des détails, une liste ou une checklist…'
checkboxLabel: 'Élément de checklist : {item}'
edit: 'Modifier les détails'
</i18n>

<i18n lang="yaml" locale="pl">
placeholder: 'Dodaj szczegóły, listę lub listę kontrolną…'
checkboxLabel: 'Pozycja listy kontrolnej: {item}'
edit: 'Edytuj szczegóły'
</i18n>

<i18n lang="yaml" locale="cs">
placeholder: 'Přidej podrobnosti, seznam nebo kontrolní seznam…'
checkboxLabel: 'Položka kontrolního seznamu: {item}'
edit: 'Upravit podrobnosti'
</i18n>
