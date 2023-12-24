<template>
  <page-state-handler
    padding
    class="row justify-center"
  >
    <!-- content -->

    <div class="col-xs-12 col-sm-11 col-md-10 col-lg-9 col-xl-7 q-gutter-lg">
      <div class="text-h4">
        {{ t('title') }}
      </div>

      <q-input
        v-model="notification.subject"
        :label="t('field.subject')"
        rounded
        outlined
      />

      <q-editor
        ref="editorRef"
        v-model="notification.body"
        :toolbar="[
          ['token'],
          ['bold', 'italic', 'strike', 'underline'],
          ['unordered', 'ordered', 'outdent', 'indent'],
          ['link', 'hr', 'quote', 'url'],
          ['undo', 'redo'],
        ]"
      >
        <!-- Variables -->
        <template #token>
          <q-btn-dropdown
            ref="tokenRef"
            label="Variable"
            size="sm"
            icon="add"
            dense
            no-caps
            no-wrap
            unelevated
          >
            <q-list dense>
              <q-item
                tag="label"
                clickable
                @click="add('email')"
              >
                <q-item-section side>
                  <q-icon name="mail" />
                </q-item-section>
                <q-item-section>Email</q-item-section>
              </q-item>
              <q-item
                tag="label"
                clickable
                @click="add('title')"
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

      {{ notification.body }}
    </div>
  </page-state-handler>
</template>

<script lang="ts" setup>
import PageStateHandler from 'components/common/PageStateHandler.vue';
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';
import { useQuasar } from 'quasar';

const quasar = useQuasar();

const editorRef = ref(null);
const tokenRef = ref(null);

const notification = ref<{
  subject: string;
  body: string;
}>({
  subject: '',
  body: '',
});

const { t } = useI18n();

function add(variableName: string) {
  const edit = editorRef.value;
  tokenRef.value.hide();
  edit.caret.restore();
  edit.runCmd(
    'insertHTML',
    `&nbsp;<div class="editor_token row inline items-center" contenteditable="false">&nbsp;<span>${variableName}</span>&nbsp;<i class="q-icon material-icons cursor-pointer" onclick="this.parentNode.parentNode.removeChild(this.parentNode)">close</i></div>&nbsp;`,
  );
  edit.focus();
}
</script>

<style lang="scss">
.body--light {
  .editor_token {
    background: rgba(0, 0, 0, 0.6);
    color: white;
  }
}

.body--dark {
  .editor_token {
    background: rgba(255, 255, 255, 0.6);
    color: black;
  }
}

.editor_token {
  padding: 3px;
}

.editor_token,
.editor_token .q-icon {
  border-radius: 10px;
}

.editor_token .q-icon {
  background: rgba(0, 0, 0, 0.2);
}
</style>
