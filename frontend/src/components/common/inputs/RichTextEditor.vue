<template>
  <div
    v-if="editor"
    class="rich-text-editor"
  >
    <div class="rich-text-editor__toolbar row items-center q-pa-xs">
      <q-btn
        v-for="action in inlineActions"
        :key="action.name"
        :icon="action.icon"
        :color="editor.isActive(action.name) ? 'primary' : undefined"
        size="sm"
        flat
        round
        dense
        @click="action.run"
      >
        <q-tooltip :delay="300">{{ action.label }}</q-tooltip>
      </q-btn>

      <q-separator
        vertical
        inset
      />

      <q-btn
        v-for="level in [2, 3]"
        :key="`h${level}`"
        :label="`H${level}`"
        :color="editor.isActive('heading', { level }) ? 'primary' : undefined"
        size="sm"
        flat
        dense
        no-caps
        @click="editor.chain().focus().toggleHeading({ level }).run()"
      >
        <q-tooltip :delay="300">{{ t('heading', { level }) }}</q-tooltip>
      </q-btn>

      <q-separator
        vertical
        inset
      />

      <q-btn
        icon="format_list_bulleted"
        :color="editor.isActive('bulletList') ? 'primary' : undefined"
        size="sm"
        flat
        round
        dense
        @click="editor.chain().focus().toggleBulletList().run()"
      >
        <q-tooltip :delay="300">{{ t('bulletList') }}</q-tooltip>
      </q-btn>
      <q-btn
        icon="format_list_numbered"
        :color="editor.isActive('orderedList') ? 'primary' : undefined"
        size="sm"
        flat
        round
        dense
        @click="editor.chain().focus().toggleOrderedList().run()"
      >
        <q-tooltip :delay="300">{{ t('orderedList') }}</q-tooltip>
      </q-btn>
      <q-btn
        icon="format_quote"
        :color="editor.isActive('blockquote') ? 'primary' : undefined"
        size="sm"
        flat
        round
        dense
        @click="editor.chain().focus().toggleBlockquote().run()"
      >
        <q-tooltip :delay="300">{{ t('blockquote') }}</q-tooltip>
      </q-btn>

      <q-separator
        vertical
        inset
      />

      <q-btn
        icon="link"
        :color="editor.isActive('link') ? 'primary' : undefined"
        size="sm"
        flat
        round
        dense
        @click="setLink"
      >
        <q-tooltip :delay="300">{{ t('link') }}</q-tooltip>
      </q-btn>
      <q-btn
        icon="link_off"
        size="sm"
        flat
        round
        dense
        :disable="!editor.isActive('link')"
        @click="editor.chain().focus().unsetLink().run()"
      >
        <q-tooltip :delay="300">{{ t('unlink') }}</q-tooltip>
      </q-btn>
    </div>

    <q-separator />

    <editor-content
      :editor
      class="rich-text-editor__content"
    />
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

const { placeholder } = defineProps<{
  placeholder?: string;
}>();

const model = defineModel<string>({ default: '' });

const { t } = useI18n();
const quasar = useQuasar();

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { target: '_blank', rel: 'noopener nofollow' },
      },
    }),
    Placeholder.configure({
      placeholder: () => placeholder ?? '',
    }),
  ],
  content: model.value,
  onUpdate: ({ editor }) => {
    // Normalise TipTap's empty document (`<p></p>`) to an empty string so an
    // untouched editor is not treated as content.
    model.value = editor.isEmpty ? '' : editor.getHTML();
  },
});

// Re-sync when the bound value changes externally (e.g. switching locale tabs
// or the parent reloading the document).
watch(model, (value) => {
  if (!editor.value) {
    return;
  }

  const current = editor.value.isEmpty ? '' : editor.value.getHTML();
  if (value === current) {
    return;
  }

  editor.value.commands.setContent(value || '', { emitUpdate: false });
});

function setLink() {
  if (!editor.value) {
    return;
  }

  const previousUrl = editor.value.getAttributes('link').href as
    string | undefined;

  quasar
    .dialog({
      title: t('link'),
      prompt: {
        model: previousUrl ?? '',
        type: 'url',
        outlined: true,
      },
      cancel: { flat: true, rounded: true, label: t('cancel') },
      ok: { rounded: true, label: t('apply') },
    })
    .onOk((url: string) => {
      const chain = editor.value?.chain().focus().extendMarkRange('link');

      if (url === '') {
        chain?.unsetLink().run();
        return;
      }

      chain?.setLink({ href: url }).run();
    });
}

const inlineActions = [
  {
    name: 'bold',
    icon: 'format_bold',
    label: t('bold'),
    run: () => editor.value?.chain().focus().toggleBold().run(),
  },
  {
    name: 'italic',
    icon: 'format_italic',
    label: t('italic'),
    run: () => editor.value?.chain().focus().toggleItalic().run(),
  },
  {
    name: 'underline',
    icon: 'format_underlined',
    label: t('underline'),
    run: () => editor.value?.chain().focus().toggleUnderline().run(),
  },
];

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style scoped>
.rich-text-editor {
  display: flex;
  flex-direction: column;
  background: var(--md3-surface);
}

.rich-text-editor__toolbar {
  background: var(--md3-surface-container-low);
  gap: 4px;
  flex-shrink: 0;
}

/* The content wrapper (not the ProseMirror element inside it) owns the
   scroll: it's the flex item bounded by the surrounding layout, so it's
   the one that can actually shrink instead of pushing the card's action
   buttons off-screen as the text grows. */
.rich-text-editor__content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.rich-text-editor__content :deep(.ProseMirror) {
  min-height: 200px;
  padding: 16px;
  outline: none;
}

.rich-text-editor__content :deep(.ProseMirror:focus) {
  outline: none;
}

/* Placeholder shown on an empty editor (TipTap adds this data attribute). */
.rich-text-editor__content
  :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
  color: var(--md3-on-surface-variant);
}

.rich-text-editor__content :deep(.ProseMirror h2),
.rich-text-editor__content :deep(.ProseMirror h3) {
  color: var(--md3-on-surface);
  margin: 0.8em 0 0.4em;
}

.rich-text-editor__content :deep(.ProseMirror a) {
  color: var(--md3-primary);
}

.rich-text-editor__content :deep(.ProseMirror blockquote) {
  border-left: 3px solid var(--md3-outline-variant);
  padding-left: 12px;
  color: var(--md3-on-surface-variant);
}
</style>

<i18n lang="yaml" locale="en">
bold: 'Bold'
italic: 'Italic'
underline: 'Underline'
heading: 'Heading {level}'
bulletList: 'Bullet list'
orderedList: 'Numbered list'
blockquote: 'Quote'
link: 'Link'
unlink: 'Remove link'
apply: 'Apply'
cancel: 'Cancel'
</i18n>

<i18n lang="yaml" locale="de">
bold: 'Fett'
italic: 'Kursiv'
underline: 'Unterstrichen'
heading: 'Überschrift {level}'
bulletList: 'Aufzählung'
orderedList: 'Nummerierte Liste'
blockquote: 'Zitat'
link: 'Link'
unlink: 'Link entfernen'
apply: 'Übernehmen'
cancel: 'Abbrechen'
</i18n>

<i18n lang="yaml" locale="fr">
bold: 'Gras'
italic: 'Italique'
underline: 'Souligné'
heading: 'Titre {level}'
bulletList: 'Liste à puces'
orderedList: 'Liste numérotée'
blockquote: 'Citation'
link: 'Lien'
unlink: 'Supprimer le lien'
apply: 'Appliquer'
cancel: 'Annuler'
</i18n>

<i18n lang="yaml" locale="pl">
bold: 'Pogrubienie'
italic: 'Kursywa'
underline: 'Podkreślenie'
heading: 'Nagłówek {level}'
bulletList: 'Lista punktowana'
orderedList: 'Lista numerowana'
blockquote: 'Cytat'
link: 'Odnośnik'
unlink: 'Usuń odnośnik'
apply: 'Zastosuj'
cancel: 'Anuluj'
</i18n>

<i18n lang="yaml" locale="cs">
bold: 'Tučné'
italic: 'Kurzíva'
underline: 'Podtržené'
heading: 'Nadpis {level}'
bulletList: 'Odrážkový seznam'
orderedList: 'Číslovaný seznam'
blockquote: 'Citace'
link: 'Odkaz'
unlink: 'Odebrat odkaz'
apply: 'Použít'
cancel: 'Zrušit'
</i18n>
