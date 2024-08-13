<template>
  <div class="relative-position">
    <q-editor
      ref="editorRef"
      v-model="text"
      :toolbar
      :definitions
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
          :label="t('token')"
          dense
          no-caps
          no-wrap
          unelevated
          size="sm"
        >
          <!-- TODO -->
          <q-list dense>
            <q-item
              v-close-popup
              tag="label"
              clickable
              @click="addToken('email')"
            >
              <q-item-section side>
                <q-icon name="mail" />
              </q-item-section>
              <q-item-section>Email</q-item-section>
            </q-item>
            <q-item
              tag="label"
              clickable
              @click="addToken('title')"
            >
              <q-item-section side>
                <q-icon name="title" />
              </q-item-section>
              <q-item-section>Title</q-item-section>
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
import { ref } from 'vue';

const quasar = useQuasar();
const { t } = useI18n();

const text = defineModel<string>({
  required: true,
  default: '',
});

interface Tokens {
  label: string;
  values: string[];
}

const props = defineProps<{
  tokens?: Tokens[];
}>();

defineExpose({
  // TODO Expose processed text
});

// TODO Font size
// TODO Tokens

const editorRef = ref<QEditor | null>(null);
const processorRef = ref<HTMLDivElement | null>(null);

const toolbar: QEditorProps['toolbar'] = [
  ['registrationToken', 'campToken'],
  ['bold', 'italic', 'underline', 'strike'],
  ['foreColor', 'backColor'],
  [
    {
      label: quasar.lang.editor.formatting,
      icon: quasar.iconSet.editor.formatting,
      list: 'no-icons',
      options: ['p', 'h3', 'h4', 'h5', 'h6', 'code'],
    },
  ],
  ['unordered', 'ordered', 'outdent', 'indent'],
  ['hr', 'quote', 'link', 'upload'],
  ['removeFormat'],
  ['undo', 'redo'],
  ['fullscreen'],
];

const addAttachment = () => {
  // TODO
};

const definitions: QEditorProps['definitions'] = {
  upload: {
    tip: t('definition.upload.tip'),
    icon: 'cloud_upload',
    handler: addAttachment,
  },
};

function processText(text: string): string {
  if (!processorRef.value) {
    return text;
  }

  processorRef.value.innerHTML = text;
  const tokenEls = processorRef.value.querySelectorAll('.editor_token');
  tokenEls.forEach((tokenEl) => {
    const name = tokenEl.querySelector('span')?.textContent;
    const value = name ? getTokenValue(name) : '???';

    // Clean up div
    tokenEl.removeAttribute('class');
    tokenEl.removeAttribute('contenteditable');
    tokenEl.innerHTML = value;
  });

  return processorRef.value.innerHTML;
}

function getTokenValue(name: string) {
  // TODO Get token value
  return name;
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
  editor.runCmd(
    'insertHTML',
    `<div class="editor_token row inline items-center" contenteditable="false">
      &nbsp;
      <span>
        ${name}
      </span>
      &nbsp;
      <i class="q-icon material-icons cursor-pointer" onclick="this.parentNode.parentNode.removeChild(this.parentNode)">
        close
      </i>
    </div>`,
  );

  // TODO Set cursor behind inserted element

  editor.focus();
}
</script>

<style lang="scss" scoped>
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
