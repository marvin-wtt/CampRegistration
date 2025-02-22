<template>
  <div
    v-if="editor"
    class="column q-gutter-sm"
  >
    <div>
      <bubble-menu
        :editor
        :tippy-options="{ duration: 100 }"
        class="bubble-menu q-pa-xs"
      >
        <div class="row q-gutter-xs no-wrap">
          <q-btn
            icon="format_bold"
            :color="editor.isActive('bold') ? 'primary' : 'grey'"
            :outline="!editor.isActive('bold')"
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
            :color="editor.isActive('italic') ? 'primary' : 'grey'"
            :outline="!editor.isActive('italic')"
            size="xs"
            round
            unelevated
            @click="editor.chain().focus().toggleItalic().run()"
          />
          <q-btn
            icon="format_underlined"
            :color="editor.isActive('underline') ? 'primary' : 'grey'"
            :outline="!editor.isActive('underline')"
            size="xs"
            round
            unelevated
            @click="editor.chain().focus().toggleUnderline().run()"
          />
          <q-btn
            icon="strikethrough_s"
            :color="editor.isActive('strike') ? 'primary' : 'grey'"
            :outline="!editor.isActive('strike')"
            size="xs"
            round
            unelevated
            @click="editor.chain().focus().toggleStrike().run()"
          />

          <q-separator vertical />

          <!-- TODO Set tooltip -->
          <!-- https://github.com/quasarframework/quasar/issues/16955 -->
          <q-btn-dropdown
            size="xs"
            color="grey"
            outline
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
            color="grey"
            outline
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

          <q-separator vertical />

          <q-btn
            icon="format_list_bulleted"
            :color="editor.isActive('bulletList') ? 'primary' : 'grey'"
            :outline="!editor.isActive('bulletList')"
            size="xs"
            round
            unelevated
            @click="editor.chain().focus().toggleBulletList().run()"
          />
          <q-btn
            icon="format_list_numbered"
            :color="editor.isActive('orderedList') ? 'primary' : 'grey'"
            :outline="!editor.isActive('orderedList')"
            size="xs"
            round
            unelevated
            @click="editor.chain().focus().toggleOrderedList().run()"
          />
          <q-btn
            v-if="editor.can().liftListItem('listItem')"
            icon="format_indent_decrease"
            color="grey"
            outline
            size="xs"
            round
            unelevated
            @click="editor.chain().focus().liftListItem('listItem').run()"
          />
          <q-btn
            v-if="editor.can().sinkListItem('listItem')"
            icon="format_indent_increase"
            color="grey"
            outline
            size="xs"
            round
            unelevated
            @click="editor.chain().focus().sinkListItem('listItem').run()"
          />

          <q-separator vertical />

          <q-btn
            icon="format_clear"
            color="grey"
            outline
            size="xs"
            round
            unelevated
            @click="editor.chain().focus().unsetAllMarks().run()"
          />
        </div>
      </bubble-menu>

      <!--      <floating-menu>-->
      <!--        &lt;!&ndash; TODO &ndash;&gt;-->
      <!--      </floating-menu>-->
    </div>

    <!-- Action buttons -->
    <div class="col-shrink">
      <q-btn
        label="Add token"
        icon="add"
        size="sm"
        unelevated
        outline
        rounded
        @click="onAddToken"
      />
    </div>

    <div class="col-grow">
      <editor-content
        :editor
        class="fit editor"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useQuasar, debounce, QSelectOption } from 'quasar';
import { useI18n } from 'vue-i18n';
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';
import { type Token } from 'components/campManagement/contact/Token';
import TokenSelectionDialog from 'components/campManagement/contact/TokenSelectionDialog.vue';
import StarterKit from '@tiptap/starter-kit';
import {
  EditorContent,
  FloatingMenu,
  BubbleMenu,
  useEditor,
} from '@tiptap/vue-3';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import ListItem from '@tiptap/extension-list-item';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Variable from './VariableNode';

const quasar = useQuasar();
const { t } = useI18n();

const model = defineModel<string>({
  required: true,
});

const { tokens = [] } = defineProps<{
  tokens?: Token[];
}>();

const variables = computed(() => {
  return (
    tokens.flatMap((token) =>
      token.items.map((item) => tokenEntryToVariable(token, item)),
    ) ?? []
  );
});

function tokenEntryToVariable(token: Token, item: Token['items'][0]) {
  return {
    value: `${token.key}.${item.value}`,
    label: item.label,
    category: token.label,
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
    Placeholder.configure({
      placeholder: t('placeholder.body'),
    }),
    Underline,
    Color.configure({ types: [TextStyle.name, ListItem.name] }),
    Highlight.configure({
      multicolor: true,
    }),
    TextStyle.configure({ types: [ListItem.name] }),
    Variable.configure({
      variables: variables.value,
    }),
  ],
  content: model.value,
  onUpdate: () => {
    debounce(() => {
      model.value = editor.value?.getHTML() ?? '';
    }, 1000);
  },
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});

watch(model, (value) => {
  const isSame = editor.value?.getHTML() === value;
  if (isSame) {
    return;
  }

  editor.value?.commands.setContent(value, false);
});

function onAddToken() {
  quasar
    .dialog({
      component: TokenSelectionDialog,
      componentProps: {
        tokens,
      },
    })
    .onOk(({ token, item }) => {
      editor.value
        ?.chain()
        .focus()
        .insertVariable(tokenEntryToVariable(token, item))
        .run();
    });
}
</script>

<style lang="scss">
/* Basic editor styles */

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

.body--light {
  .variable {
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
}

.body--dark {
  .variable {
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
}

.ProseMirror:focus {
  outline: none;
}

.editor {
  border-style: solid;
  border-width: 1px;
  border-color: grey;
  border-radius: 20px;
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
  /* p.is-editor-empty:first-child::before {
    color: var(--gray-4);
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }*/

  /* Placeholder (on every new line) */
  .is-empty::before {
    color: $grey-4;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
}

/* Bubble menu */
.body--light {
  .bubble-menu {
    background: white;
  }
}

.body--dark {
  .bubble-menu {
    background: $dark;
  }
}

.bubble-menu {
  border: 1px solid gray;
  border-radius: 20px;
}

/* Bubble menu */
/* TODO Replace variables for dark mode */
</style>

<i18n lang="yaml" locale="en">
placeholder: 'Type your message here...'

definition:
  token:
    tip: 'Add a variable'
</i18n>

<i18n lang="yaml" locale="de">
placeholder: 'Gib hier deine Nachricht ein...'

definition:
  token:
    tip: 'Füge eine Variable hinzu'
</i18n>

<i18n lang="yaml" locale="fr">
placeholder: 'Tapez votre message ici...'

definition:
  token:
    tip: 'Ajouter une variable'
</i18n>
