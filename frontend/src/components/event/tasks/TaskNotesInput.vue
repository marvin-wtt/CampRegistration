<template>
  <q-field
    :model-value="modelValue"
    :label
    outlined
    rounded
    data-test="task-notes-input"
    @click="focusFromField"
  >
    <template #prepend>
      <q-icon name="description" />
    </template>

    <template #control>
      <editor-content
        v-if="editor"
        :editor
        class="notes-editor task-notes-content full-width"
      />
    </template>

    <template #append>
      <task-notes-toolbar
        v-if="editor"
        :editor
      />
    </template>
  </q-field>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import Placeholder from '@tiptap/extension-placeholder';
import {
  notesMarkdown,
  taskNotesExtensions,
} from '@/components/event/tasks/taskNotesEditor';
import TaskNotesToolbar from '@/components/event/tasks/TaskNotesToolbar.vue';

const { label } = defineProps<{
  label: string;
}>();

const modelValue = defineModel<string | null | undefined>();

const emit = defineEmits<{
  focus: [];
  blur: [];
}>();

const { t } = useI18n();

// Set by `onUpdate` so the model watcher skips changes the editor made itself.
let isInternalUpdate = false;

const editor = useEditor({
  extensions: [
    ...taskNotesExtensions((item) => t('checkboxLabel', { item })),
    Placeholder.configure({ placeholder: () => t('placeholder') }),
  ],
  content: modelValue.value ?? '',
  contentType: 'markdown',
  onFocus: () => emit('focus'),
  onBlur: () => emit('blur'),
  onUpdate: ({ editor }) => {
    isInternalUpdate = true;
    modelValue.value = notesMarkdown(editor);
  },
});

watch(modelValue, (value) => {
  if (isInternalUpdate) {
    isInternalUpdate = false;
    return;
  }
  editor.value?.commands.setContent(value ?? '', {
    contentType: 'markdown',
    emitUpdate: false,
  });
});

// Clicks on the field's padding or icon should still land in the editor.
function focusFromField(event: MouseEvent) {
  if (!(event.target as Element).closest('.ProseMirror, .q-menu')) {
    editor.value?.commands.focus('end');
  }
}

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style src="./taskNotesContent.css"></style>

<style scoped>
/* Pin icon and buttons to the first line, not the middle of a long note. */
:deep(.q-field__prepend),
:deep(.q-field__append) {
  align-self: flex-start;
  height: 56px;
}

/* Textarea-like: the field grows from the top instead of centring one line. */
:deep(.q-field__native) {
  align-items: flex-start;
}

/* The MD3 theme gives auto-height outlined fields 4px; this tops it up to the
   16px the single-line fields use. */
.notes-editor {
  padding: 12px 0;
  line-height: 24px;
}

.notes-editor
  :deep(.ProseMirror-focused p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
placeholder: 'Add details, a list or a checklist…'
checkboxLabel: 'Checklist item: {item}'
</i18n>

<i18n lang="yaml" locale="de">
placeholder: 'Details, eine Liste oder eine Checkliste hinzufügen…'
checkboxLabel: 'Checklisten-Punkt: {item}'
</i18n>

<i18n lang="yaml" locale="fr">
placeholder: 'Ajoute des détails, une liste ou une checklist…'
checkboxLabel: 'Élément de checklist : {item}'
</i18n>

<i18n lang="yaml" locale="pl">
placeholder: 'Dodaj szczegóły, listę lub listę kontrolną…'
checkboxLabel: 'Pozycja listy kontrolnej: {item}'
</i18n>

<i18n lang="yaml" locale="cs">
placeholder: 'Přidej podrobnosti, seznam nebo kontrolní seznam…'
checkboxLabel: 'Položka kontrolního seznamu: {item}'
</i18n>
