<template>
  <div class="relative-position">
    <q-editor
      ref="editorRef"
      v-model="text"
      :toolbar="toolbar"
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

      <template #token>
        <q-btn-dropdown
          icon="add_box"
          dense
          no-caps
          no-wrap
          unelevated
          size="sm"
        >
          <q-list dense>
            <q-item
              v-for="token in tokens"
              :key="token.key"
              v-close-popup
              tag="label"
              clickable
              @click="selectTokenValue(token)"
            >
              <q-item-section
                v-if="token.icon"
                side
              >
                <q-icon :name="token.icon" />
              </q-item-section>

              <q-item-section>
                {{ token.label }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
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
import { QBtnDropdown, QEditor, QEditorProps, useQuasar } from 'quasar';
import EditorColorPicker from 'components/campManagement/contact/EditorColorPicker.vue';
import { useI18n } from 'vue-i18n';
import { computed, onMounted, ref, watch } from 'vue';
import { Token } from 'components/campManagement/contact/Token';

const quasar = useQuasar();
const { t } = useI18n();

const model = defineModel<string>({
  required: true,
});
const text = ref<string>(variableToHtml(model.value));

const props = defineProps<{
  tokens?: Token[];
}>();

onMounted(() => {
  editorRef.value?.focus();
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

const editorRef = ref<QEditor | null>(null);
const processorRef = ref<HTMLDivElement | null>(null);

const defaultToolbar = [
  ['bold', 'italic', 'underline', 'strike'],
  [
    {
      icon: quasar.iconSet.editor.formatting,
      list: 'no-icons',
      options: ['p', 'h3', 'h4', 'h5', 'h6', 'code'],
    },
    {
      icon: quasar.iconSet.editor.size,
      list: 'no-icons',
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

function variableToHtml(value: string): string {
  return value.replace(/{{ *(.*?) }}/g, (match, p1) => {
    return createTokenElement(p1);
  });
}

function encodeVariable(name: string) {
  // Using non-breaking space to avoid collisions with determiner in text field
  return `{{ ${name} }}`;
}

function addColor(command: 'foreColor' | 'backColor', color: string) {
  const editor = editorRef.value;
  if (!editor) {
    return;
  }

  editor.runCmd(command, color);
  editor.focus();
}

function addToken(name: string) {
  if (!editorRef.value) {
    return;
  }

  const editor = editorRef.value;

  editor.caret.restore();
  editor.runCmd('insertHTML', createTokenElement(name));
  editor.focus();

  // FIXME Focus does not work with dialog
}

function selectTokenValue(token: Token) {
  // TODO Replace with select
  quasar
    .dialog({
      title: t('dialog.selectToken.title'),
      options: {
        model: 'name',
        type: 'radio',
        items: token.items,
      },
    })
    .onOk((value) => {
      addToken(`${token.key}.${value}`);
    });
}

function createTokenElement(name: string, label?: string): string {
  return `
    <div
      data-token="${name}"
      class="editor_token row inline items-center"
      contenteditable="false"
    >
      &nbsp;
      <span>
        ${label ?? name}
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
.editor_token {
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
