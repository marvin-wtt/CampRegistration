<template>
  <q-field
    :model-value="model"
    dense
    class="email-editor"
    :class="singleLine ? '' : 'email-editor__multiline'"
  >
    <template #control="{ focused }">
      <transition name="fade">
        <!-- Only show editor when focused or with content to prevent the label to float -->
        <div
          v-if="editor && (focused || model.length > 0)"
          class="column fit q-gutter-sm no-wrap"
        >
          <bubble-menu
            v-if="!plainText"
            :editor
            :tippy-options="{ duration: 100 }"
            class="col-shrink bubble-menu q-pa-xs"
          >
            <div class="row q-gutter-xs no-wrap">
              <q-btn
                icon="format_bold"
                :color="editor.isActive('bold') ? 'primary' : undefined"
                size="xs"
                round
                unelevated
                @click="editor.chain().focus().toggleBold().run()"
              >
                <q-tooltip :delay="200">
                  {{ t('tooltip.formatBold') }}
                </q-tooltip>
              </q-btn>
              <q-btn
                icon="format_italic"
                :color="editor.isActive('italic') ? 'primary' : undefined"
                size="xs"
                round
                unelevated
                @click="editor.chain().focus().toggleItalic().run()"
              >
                <q-tooltip :delay="200">
                  {{ t('tooltip.formatItalic') }}
                </q-tooltip>
              </q-btn>
              <q-btn
                icon="format_underlined"
                :color="editor.isActive('underline') ? 'primary' : undefined"
                size="xs"
                round
                unelevated
                @click="editor.chain().focus().toggleUnderline().run()"
              >
                <q-tooltip :delay="200">
                  {{ t('tooltip.formatUnderlined') }}
                </q-tooltip>
              </q-btn>
              <q-btn
                icon="strikethrough_s"
                :color="editor.isActive('strike') ? 'primary' : undefined"
                size="xs"
                round
                unelevated
                @click="editor.chain().focus().toggleStrike().run()"
              >
                <q-tooltip :delay="200">
                  {{ t('tooltip.formatStrikethrough') }}
                </q-tooltip>
              </q-btn>

              <q-separator vertical />

              <!-- TODO Set tooltip -->
              <!-- https://github.com/quasarframework/quasar/issues/16955 -->
              <q-btn-dropdown
                size="xs"
                split
                :menu-offset="[0, 10]"
                dense
                rounded
                unelevated
                @click="toggleTextColor()"
              >
                <template #label>
                  <q-icon
                    name="format_color_text"
                    :style="{ color: colors.text }"
                  />
                  <q-tooltip :delay="200">
                    {{ t('tooltip.formatColorText') }}
                  </q-tooltip>
                </template>
                <template #default>
                  <q-color
                    v-model="colors.text"
                    default-view="palette"
                    no-header
                    @click.stop
                    @change="toggleHighLightColor()"
                  />
                </template>
              </q-btn-dropdown>

              <!-- TODO Set tooltip -->
              <!-- https://github.com/quasarframework/quasar/issues/16955 -->
              <q-btn-dropdown
                size="xs"
                split
                :menu-offset="[0, 10]"
                dense
                rounded
                unelevated
                @click="toggleHighLightColor()"
              >
                <template #label>
                  <q-icon
                    name="format_color_fill"
                    :style="{ color: colors.highlight }"
                  />
                  <q-tooltip :delay="200">
                    {{ t('tooltip.formatColorFill') }}
                  </q-tooltip>
                </template>
                <template #default>
                  <q-color
                    v-model="colors.highlight"
                    default-view="palette"
                    no-header
                    @click.stop
                    @change="toggleHighLightColor()"
                  />
                </template>
              </q-btn-dropdown>

              <!-- List formats -->
              <template v-if="!singleLine">
                <q-separator vertical />

                <q-btn
                  icon="format_list_bulleted"
                  :color="editor.isActive('bulletList') ? 'primary' : undefined"
                  size="xs"
                  round
                  unelevated
                  @click="editor.chain().focus().toggleBulletList().run()"
                >
                  <q-tooltip :delay="200">
                    {{ t('tooltip.formatBulleted') }}
                  </q-tooltip>
                </q-btn>
                <q-btn
                  icon="format_list_numbered"
                  :color="
                    editor.isActive('orderedList') ? 'primary' : undefined
                  "
                  size="xs"
                  round
                  unelevated
                  @click="editor.chain().focus().toggleOrderedList().run()"
                >
                  <q-tooltip :delay="200">
                    {{ t('tooltip.formatOrdered') }}
                  </q-tooltip>
                </q-btn>
                <q-btn
                  v-if="editor.can().liftListItem('listItem')"
                  icon="format_indent_decrease"
                  size="xs"
                  round
                  unelevated
                  @click="editor.chain().focus().liftListItem('listItem').run()"
                >
                  <q-tooltip :delay="200">
                    {{ t('tooltip.formatIndentDecrease') }}
                  </q-tooltip>
                </q-btn>
                <q-btn
                  v-if="editor.can().sinkListItem('listItem')"
                  icon="format_indent_increase"
                  size="xs"
                  round
                  unelevated
                  @click="editor.chain().focus().sinkListItem('listItem').run()"
                >
                  <q-tooltip :delay="200">
                    {{ t('tooltip.formatIndentIncrease') }}
                  </q-tooltip>
                </q-btn>
              </template>

              <q-separator vertical />

              <q-btn
                icon="format_clear"
                size="xs"
                round
                unelevated
                @click="editor.chain().focus().unsetAllMarks().run()"
              >
                <q-tooltip :delay="200">
                  {{ t('tooltip.formatClear') }}
                </q-tooltip>
              </q-btn>
            </div>
          </bubble-menu>

          <!-- Action buttons -->
          <div
            v-if="focused"
            class="col-shrink row q-gutter-xs"
          >
            <q-btn
              :label="t('token.label')"
              icon="add"
              size="xs"
              unelevated
              outline
              rounded
              @click="onAddToken"
            >
              <q-tooltip :delay="200">
                {{ t('tooltip.addToken') }}
              </q-tooltip>
            </q-btn>

            <q-separator vertical />

            <q-btn
              icon="undo"
              :disable="!editor.can().undo()"
              round
              outline
              size="xs"
              @click="editor.chain().focus().undo().run()"
            >
              <q-tooltip :delay="200">
                {{ t('tooltip.undo') }}
              </q-tooltip>
            </q-btn>

            <q-btn
              icon="redo"
              :disable="!editor.can().redo()"
              round
              outline
              size="xs"
              @click="editor.chain().focus().redo().run()"
            >
              <q-tooltip :delay="200">
                {{ t('tooltip.redo') }}
              </q-tooltip>
            </q-btn>
          </div>

          <div
            v-if="focused"
            class="col-shrink"
          >
            <q-separator inset />
          </div>

          <div class="col">
            <editor-content
              :editor
              class="editor fit"
            />
          </div>
        </div>
      </transition>
    </template>
  </q-field>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { computed, onBeforeUnmount, reactive, watch } from 'vue';
import type {
  Token,
  TokenRegistry,
} from 'components/campManagement/contact/TokenRegistry';
import TokenSelectionDialog from 'components/campManagement/contact/TokenSelectionDialog.vue';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, BubbleMenu, useEditor } from '@tiptap/vue-3';
import type { Editor } from '@tiptap/core';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import ListItem from '@tiptap/extension-list-item';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Typography from '@tiptap/extension-typography';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Variable, {
  type VariableDefinition,
  type VariableList,
} from './VariableNode';

const quasar = useQuasar();
const { t } = useI18n();

const model = defineModel<string>({
  required: true,
});

const {
  tokens = [],
  singleLine = false,
  plainText = false,
  placeholder,
} = defineProps<{
  tokens?: TokenRegistry[];
  plainText?: boolean;
  singleLine?: boolean;
  placeholder?: string;
}>();

const variables = computed<VariableList>(() => {
  return tokens.flatMap(tokenRegistryToVariableList);
});

function tokenRegistryToVariableList(
  registry: TokenRegistry | Token,
): VariableList {
  if ('items' in registry) {
    return registry.items.flatMap((item) =>
      tokenRegistryToVariableList({
        ...item,
        value: `${registry.value}.${item.value}`,
        category: registry.category ?? registry.label,
      }),
    );
  }

  return [tokenToVariable(registry)];
}

function tokenToVariable(token: Token): VariableDefinition {
  return {
    value: token.value,
    label: token.label,
    category: token.category,
  };
}

const colors = reactive({
  highlight: '#fffe04',
  text: '#ff0000',
});

function toggleTextColor() {
  const currentColor = editor.value?.getAttributes('textStyle').color;
  if (colors.text !== '#000000' && colors.text !== currentColor) {
    editor.value?.chain().focus().setColor(colors.text).run();
  } else {
    editor.value?.chain().focus().unsetColor().run();
  }
}

function toggleHighLightColor() {
  editor.value
    ?.chain()
    .focus()
    .toggleHighlight({ color: colors.highlight })
    .run();
}

const editor = useEditor({
  extensions: [
    StarterKit,
    Document.extend({
      content: singleLine ? 'block' : 'block+',
    }),
    Placeholder.configure({
      placeholder: placeholder ?? t('placeholder'),
    }),
    Underline,
    Color.configure({ types: [TextStyle.name, ListItem.name] }),
    Highlight.configure({
      multicolor: true,
    }),
    TextStyle.configure({ types: [ListItem.name] }),
    HardBreak,
    Variable.configure({
      variables: variables.value,
    }),
    Typography,
  ],
  content: wrapTemplateVariables(model.value),
  onUpdate: ({ editor }) => {
    model.value = unwrapTemplateVariables(getEditorValue(editor));
  },
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});

watch(model, (value) => {
  const text = editor.value ? getEditorValue(editor.value) : undefined;
  const isSame =
    text === value || (text && unwrapTemplateVariables(text) === value);
  if (isSame) {
    return;
  }

  editor.value?.commands.setContent(wrapTemplateVariables(value), false);
});

function getEditorValue(editor: Editor) {
  return plainText ? editor.getText() : editor.getHTML();
}

function wrapTemplateVariables(html: string): string {
  // This regex matches patterns like {{ some.variable }}
  const regex = /(\{\{\s*[a-zA-Z0-9_.[\]]+\s*}})/g;
  return html.replace(regex, '<span data-variable>$1</span>');
}

function unwrapTemplateVariables(html: string): string {
  // This regex matches the <span data-variable> wrapper around the template pattern.
  const regex =
    /<span\b(?=[^>]*\bdata-variable\b)[^>]*>(\{\{\s*[a-zA-Z0-9_.[\]]+\s*}})<\/span>/g;

  return html.replace(regex, '$1');
}

function onAddToken() {
  quasar
    .dialog({
      component: TokenSelectionDialog,
      componentProps: {
        tokens,
      },
    })
    .onOk(({ token }) => {
      editor.value
        ?.chain()
        .focus()
        .insertVariable(tokenToVariable(token))
        .run();
    });
}
</script>

<style lang="scss">
.email-editor {
  .q-field__label {
    padding-left: 10px;
  }
}

/* Form style */
.email-editor__multiline {
  .q-field__control {
    display: flex;
    height: 100%;
  }
}

/* Basic editor styles */
.floating-menu {
  border: 1px solid gray;
  border-radius: 20px;
}

.body--light .floating-menu {
  background-color: $grey-3;
}

.body--dark .floating-menu {
  background-color: $grey-7;
}

.variable {
  border-width: 1px;
  border-style: solid;
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 0.9em;
  transition: background-color 0.2s;

  .variable-label {
    font-weight: bold;
  }

  .variable-category {
    margin-right: 4px;
    font-style: italic;
  }
}

.body--light .variable {
  background-color: $grey-1;
  border-color: $grey-3;
  color: black;

  &:hover {
    background-color: $grey-4;
  }

  .variable-label {
    color: $grey-7;
  }

  .variable-category {
    color: $primary;
  }
}

.body--dark .variable {
  background-color: $dark;
  border-color: $grey-7;
  color: white;

  &:hover {
    background-color: $grey-9;
  }

  .variable-label {
    color: $grey-2;
  }

  .variable-category {
    color: $primary;
  }
}

.ProseMirror:focus {
  outline: none;
}

.tiptap {
  height: 100%;
  padding: 10px;

  :first-child {
    margin-top: 0;
  }

  /* List styles */
  ul,
  ol {
    padding: 0 1rem;
    margin: 1.25rem 1rem 1.25rem 0.4rem;

    li p {
      margin-top: 0.25em;
      margin-bottom: 0.25em;
    }
  }

  /* Heading styles */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    line-height: 1.1;
    margin-top: 2.5rem;
    text-wrap: pretty;
  }

  h1,
  h2 {
    margin-top: 3.5rem;
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 1.4rem;
  }

  h2 {
    font-size: 1.2rem;
  }

  h3 {
    font-size: 1.1rem;
  }

  h4,
  h5,
  h6 {
    font-size: 1rem;
  }

  /* Code and preformatted text styles */
  code {
    background-color: $primary;
    border-radius: 0.4rem;
    color: black;
    font-size: 0.85rem;
    padding: 0.25em 0.3em;
  }

  pre {
    background: black;
    border-radius: 0.5rem;
    color: white;
    font-family: 'JetBrainsMono', monospace;
    margin: 1.5rem 0;
    padding: 0.75rem 1rem;

    code {
      background: none;
      color: inherit;
      font-size: 0.8rem;
      padding: 0;
    }
  }

  blockquote {
    border-left: 3px solid $grey-3;
    margin: 1.5rem 0;
    padding-left: 1rem;
  }

  hr {
    border: none;
    border-top: 1px solid $grey-2;
    margin: 2rem 0;
  }

  /* Placeholder (at the top) */
  p.is-editor-empty:first-child::before {
    color: var(--gray-4);
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }

  /* Placeholder (on every new line) */
  /*.is-empty::before {
    color: $grey-4;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }*/
}

/* Bubble menu */
.body--light .bubble-menu {
  background: white;
}

.body--dark .bubble-menu {
  background: $dark;
}

.bubble-menu {
  border: 1px solid gray;
  border-radius: 20px;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<i18n lang="yaml" locale="en">
placeholder: 'Type your message here...'

token:
  label: 'Variables'

tooltip:
  formatBold: 'Bold'
  formatItalic: 'Italic'
  formatUnderlined: 'Underlined'
  formatStrikethrough: 'Strikethrough'
  formatColorText: 'Text color'
  formatColorFill: 'Highlight color'
  formatBulleted: 'Bulleted list'
  formatOrdered: 'Ordered list'
  formatIndentDecrease: 'Decrease indent'
  formatIndentIncrease: 'Increase indent'
  formatClear: 'Clear formatting'
  addToken: 'Add token'
  undo: 'Undo'
  redo: 'Redo'
</i18n>

<i18n lang="yaml" locale="de">
placeholder: 'Gib hier deine Nachricht ein...'

token:
  label: 'Variablen'

tooltip:
  formatBold: 'Fett'
  formatItalic: 'Kursiv'
  formatUnderlined: 'Unterstrichen'
  formatStrikethrough: 'Durchgestrichen'
  formatColorText: 'Textfarbe'
  formatColorFill: 'Hervorhebungsfarbe'
  formatBulleted: 'Aufzählungsliste'
  formatOrdered: 'Nummerierte Liste'
  formatIndentDecrease: 'Einzug verkleinern'
  formatIndentIncrease: 'Einzug vergrößern'
  formatClear: 'Formatierung löschen'
  addToken: 'Variable hinzufügen'
  undo: 'Rückgängig'
  redo: 'Wiederholen'
</i18n>

<i18n lang="yaml" locale="fr">
placeholder: 'Tapez votre message ici...'

token:
  label: 'Variables'

tooltip:
  formatBold: 'Gras'
  formatItalic: 'Italique'
  formatUnderlined: 'Souligné'
  formatStrikethrough: 'Barré'
  formatColorText: 'Couleur du texte'
  formatColorFill: 'Couleur de surlignage'
  formatBulleted: 'Liste à puces'
  formatOrdered: 'Liste numérotée'
  formatIndentDecrease: 'Diminuer le retrait'
  formatIndentIncrease: 'Augmenter le retrait'
  formatClear: 'Effacer la mise en forme'
  addToken: 'Ajouter un jeton'
  undo: 'Annuler'
  redo: 'Rétablir'
</i18n>

<i18n lang="yaml" locale="pl">
placeholder: 'Wpisz tutaj swoją wiadomość...'

token:
  label: 'Zmienne'

tooltip:
  formatBold: 'Pogrubienie'
  formatItalic: 'Kursywa'
  formatUnderlined: 'Podkreślenie'
  formatStrikethrough: 'Przekreślenie'
  formatColorText: 'Kolor tekstu'
  formatColorFill: 'Kolor tła'
  formatBulleted: 'Lista punktowana'
  formatOrdered: 'Lista numerowana'
  formatIndentDecrease: 'Zmniejsz wcięcie'
  formatIndentIncrease: 'Zwiększ wcięcie'
  formatClear: 'Wyczyść formatowanie'
  addToken: 'Dodaj zmienną'
  undo: 'Cofnij'
  redo: 'Ponów'
</i18n>

<i18n lang="yaml" locale="cs">
placeholder: 'Zadejte svou zprávu sem...'

token:
  label: 'Proměnné'

tooltip:
  formatBold: 'Tučné'
  formatItalic: 'Kurzíva'
  formatUnderlined: 'Podtržené'
  formatStrikethrough: 'Přeškrtnuté'
  formatColorText: 'Barva textu'
  formatColorFill: 'Barva zvýraznění'
  formatBulleted: 'Odrážkový seznam'
  formatOrdered: 'Číslovaný seznam'
  formatIndentDecrease: 'Zmenšit odsazení'
  formatIndentIncrease: 'Zvětšit odsazení'
  formatClear: 'Vymazat formátování'
  addToken: 'Přidat proměnnou'
  undo: 'Zpět'
  redo: 'Znovu'
</i18n>
