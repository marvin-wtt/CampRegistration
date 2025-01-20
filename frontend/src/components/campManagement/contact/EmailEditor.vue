<template>
  <div class="relative-position">
    <q-editor
      ref="editorRef"
      v-model="text"
      :toolbar
      :definitions
      :placeholder="t('placeholder')"
      content-class=""
      class="absolute fit"
    >
      <template #foreColor>
        <editor-color-picker
          icon="border_color"
          @change="(color) => addColor('foreColor', color)"
        />
      </template>

      <template #backColor>
        <editor-color-picker
          icon="format_color_text"
          color="#f5ff00"
          @change="(color) => addColor('backColor', color)"
        />
      </template>
    </q-editor>

    <!-- Only used to replace the tokens without processing the html string -->
    <div
      ref="processorRef"
      style="display: none"
    />
  </div>
</template>

<script lang="ts" setup>
import {
  QEditor,
  type QEditorProps,
  type QSelectOption,
  useQuasar,
} from 'quasar';
import EditorColorPicker from 'components/campManagement/contact/EditorColorPicker.vue';
import { useI18n } from 'vue-i18n';
import { computed, onMounted, ref, watch } from 'vue';
import { type Token } from 'components/campManagement/contact/Token';
import TokenSelectionDialog from 'components/campManagement/contact/TokenSelectionDialog.vue';

const quasar = useQuasar();
const { t } = useI18n();

const model = defineModel<string>({
  required: true,
});
const text = ref<string>('');

const editorRef = ref<QEditor | null>(null);
const processorRef = ref<HTMLDivElement | null>(null);

const props = defineProps<{
  tokens?: Token[];
}>();

onMounted(() => {
  editorRef.value?.focus();

  text.value = variableToHtml(model.value);
});

let lastTextValue: string = '';
watch(model, (value) => {
  if (lastTextValue === value) {
    return;
  }

  text.value = variableToHtml(value);
});

watch(text, (value) => {
  value = htmlToVariable(value);
  lastTextValue = value;
  model.value = value;
});

const defaultToolbar = [
  ['bold', 'italic', 'underline', 'strike'],
  [
    {
      icon: quasar.iconSet.editor.formatting,
      list: 'no-icons',
      fixedLabel: true,
      fixedIcon: true,
      options: ['p', 'h3', 'h4', 'h5', 'h6', 'code'],
    },
    {
      icon: quasar.iconSet.editor.size,
      list: 'no-icons',
      fixedLabel: true,
      fixedIcon: true,
      options: [
        'size-1',
        'size-2',
        'size-3',
        'size-4',
        'size-5',
        'size-6',
        'size-7',
      ],
    },
    'foreColor',
    'backColor',
  ],
  ['unordered', 'ordered', 'outdent', 'indent'],
  ['hr', 'quote', 'link'],
  ['undo', 'redo', 'removeFormat', 'fullscreen'],
];

const definitions: QEditorProps['definitions'] = {
  token: {
    icon: 'add_box',
    tip: t('definition.token.tip'),
    handler: onAddToken,
  },
};

const toolbar = computed<QEditorProps['toolbar']>(() => {
  const toolbar = [...defaultToolbar];

  if (props.tokens && props.tokens.length > 0) {
    toolbar.unshift(['token']);
  }

  return toolbar;
});

function htmlToVariable(value: string): string {
  if (!processorRef.value) {
    return value;
  }

  // Replace determiners spaces with non-breaking spaces to avoid invalid conversion
  value = value.replace(/`{{ `/g, '{{\u00A0');
  value = value.replace(/`}} `/g, '\u00A0}}');

  processorRef.value.innerHTML = value;
  const tokenEls = processorRef.value.querySelectorAll('[data-token]');
  tokenEls.forEach((element) => {
    const name = element.getAttribute('data-token');
    const value = name ? encodeVariable(name) : '???';

    element.insertAdjacentHTML('beforebegin', value);
    element.remove();
  });

  return processorRef.value.innerHTML;
}

function encodeVariable(name: string) {
  return `{{ ${name} }}`;
}

function variableToHtml(value: string): string {
  return value.replace(/{{ *(.*?) }}/g, (match, p1) => {
    return createTokenElement({
      value: p1,
      label: getVariableLabel(p1),
    });
  });
}

function getVariableLabel(value: string): string {
  const options =
    props.tokens?.flatMap((token) =>
      token.items.map((item) => createTokenItem(token, item)),
    ) ?? [];

  return options.find((option) => option.value === value)?.label ?? value;
}

function createTokenItem(token: Token, item: QSelectOption): QSelectOption {
  return {
    label: `${token.label}: ${item.label}`,
    value: token.key + '.' + item.value,
  };
}

function addColor(command: 'foreColor' | 'backColor', color: string) {
  const editor = editorRef.value;
  if (!editor) {
    return;
  }

  editor.runCmd(command, color);
  editor.focus();
}

function addToken(item: QSelectOption) {
  if (!editorRef.value) {
    return;
  }

  const editor = editorRef.value;

  editor.caret.restore();
  editor.runCmd('insertHTML', createTokenElement(item));
  editor.focus();

  // FIXME Place caret after inserted element
}

function onAddToken() {
  quasar
    .dialog({
      component: TokenSelectionDialog,
      componentProps: {
        tokens: props.tokens,
      },
    })
    .onOk(({ token, item }) => {
      addToken(createTokenItem(token, item));
    })
    .onDismiss(() => editorRef.value?.focus());
}

function createTokenElement({ label, value }: QSelectOption): string {
  return `
    <div
      id="test"
      data-token="${value}"
      class="editor-token row inline items-center"
      contenteditable="false"
    >
      &nbsp;
      <span>
        ${label ?? value}
      </span>
      &nbsp;
      <i
        class="q-icon material-icons cursor-pointer"
        onclick="this.parentNode.parentNode.removeChild(this.parentNode)"
      >
        close
      </i>
    </div>`;
}
</script>

<style lang="scss">
.editor-token {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 3px;

  &,
  .q-icon {
    border-radius: 3px;
  }

  .q-icon {
    background: rgba(0, 0, 0, 0.2);
  }
}
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
