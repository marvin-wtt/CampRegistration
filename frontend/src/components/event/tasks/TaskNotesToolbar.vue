<template>
  <!-- mousedown.prevent keeps focus (and the selection) in the editor. -->
  <div class="notes-toolbar row no-wrap">
    <q-btn
      :aria-label="t('action.checklist')"
      :color="editor.isActive('taskList') ? 'primary' : 'on-surface-variant'"
      icon="checklist"
      data-test="task-notes-taskList"
      flat
      round
      dense
      @mousedown.prevent
      @click="editor.chain().focus().toggleTaskList().run()"
    >
      <q-tooltip :delay="300">{{ t('action.checklist') }}</q-tooltip>
    </q-btn>

    <q-btn
      :aria-label="t('action.format')"
      icon="text_format"
      color="on-surface-variant"
      data-test="task-notes-format"
      flat
      round
      dense
      @mousedown.prevent
    >
      <q-tooltip :delay="300">{{ t('action.format') }}</q-tooltip>
      <q-menu
        anchor="bottom right"
        self="top right"
        class="task-notes-format-menu"
        no-focus
        no-refocus
      >
        <q-list dense>
          <q-item
            v-for="option in formatOptions"
            :key="option.name"
            :data-test="`task-notes-${option.name}`"
            clickable
            @mousedown.prevent
            @click="option.toggle"
          >
            <q-item-section avatar>
              <q-icon
                :name="option.icon"
                :color="editor.isActive(option.name) ? 'primary' : undefined"
              />
            </q-item-section>
            <q-item-section>{{ option.label }}</q-item-section>
            <q-item-section
              v-if="option.shortcut"
              side
              class="text-caption"
            >
              {{ option.shortcut }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Editor } from '@tiptap/vue-3';

const { editor } = defineProps<{
  editor: Editor;
}>();

const { t } = useI18n();

const modKey = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl+';

const formatOptions = computed(() => [
  {
    name: 'bold',
    icon: 'format_bold',
    label: t('action.bold'),
    shortcut: `${modKey}B`,
    toggle: () => editor.chain().focus().toggleBold().run(),
  },
  {
    name: 'italic',
    icon: 'format_italic',
    label: t('action.italic'),
    shortcut: `${modKey}I`,
    toggle: () => editor.chain().focus().toggleItalic().run(),
  },
  {
    name: 'strike',
    icon: 'format_strikethrough',
    label: t('action.strike'),
    shortcut: null,
    toggle: () => editor.chain().focus().toggleStrike().run(),
  },
  {
    name: 'bulletList',
    icon: 'format_list_bulleted',
    label: t('action.bullets'),
    shortcut: null,
    toggle: () => editor.chain().focus().toggleBulletList().run(),
  },
  {
    name: 'orderedList',
    icon: 'format_list_numbered',
    label: t('action.numbered'),
    shortcut: null,
    toggle: () => editor.chain().focus().toggleOrderedList().run(),
  },
]);
</script>

<style scoped>
.notes-toolbar {
  gap: 2px;
}
</style>

<i18n lang="yaml" locale="en">
action:
  checklist: 'Checklist'
  format: 'Formatting'
  bold: 'Bold'
  italic: 'Italic'
  strike: 'Strikethrough'
  bullets: 'Bullet list'
  numbered: 'Numbered list'
</i18n>

<i18n lang="yaml" locale="de">
action:
  checklist: 'Checkliste'
  format: 'Formatierung'
  bold: 'Fett'
  italic: 'Kursiv'
  strike: 'Durchgestrichen'
  bullets: 'Aufzählung'
  numbered: 'Nummerierte Liste'
</i18n>

<i18n lang="yaml" locale="fr">
action:
  checklist: 'Checklist'
  format: 'Mise en forme'
  bold: 'Gras'
  italic: 'Italique'
  strike: 'Barré'
  bullets: 'Liste à puces'
  numbered: 'Liste numérotée'
</i18n>

<i18n lang="yaml" locale="pl">
action:
  checklist: 'Lista kontrolna'
  format: 'Formatowanie'
  bold: 'Pogrubienie'
  italic: 'Kursywa'
  strike: 'Przekreślenie'
  bullets: 'Lista punktowana'
  numbered: 'Lista numerowana'
</i18n>

<i18n lang="yaml" locale="cs">
action:
  checklist: 'Kontrolní seznam'
  format: 'Formátování'
  bold: 'Tučné'
  italic: 'Kurzíva'
  strike: 'Přeškrtnuté'
  bullets: 'Odrážky'
  numbered: 'Číslovaný seznam'
</i18n>
