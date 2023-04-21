<template>
  <q-page
    class="row no-wrap"
    padding
  >
    <q-list
      v-if="!edit || !editFullScreen"
      :class="editFullScreen ? 'col-12' : 'col-6'"
      padding
      separator
    >
      <q-item-label header>
        {{ t('title') }}
      </q-item-label>

      <q-item
        v-for="presetItem in presets"
        :key="presetItem.id"
        tag="label"
      >
        <q-item-section avatar>
          <q-avatar
            color="primary"
            text-color="white"
          >
            {{ presetItem.order }}
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label>
            {{ presetItem.title }}
          </q-item-label>
          <q-item-label
            caption
            lines="1"
          >
            {{ presetItem.columns.length }} {{ t('columns') }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn
            icon="edit"
            outline
            rounded
            @click="showEditPreset(presetItem)"
          />
        </q-item-section>
        <q-item-section side>
          <q-btn
            color="negative"
            icon="delete"
            outline
            rounded
          />
        </q-item-section>
      </q-item>
    </q-list>

    <q-separator
      v-if="!editFullScreen"
      spaced
      vertical
    />

    <div
      v-if="edit"
      :class="editFullScreen ? 'col-12' : 'col-6'"
    >
      <q-form>
        <div class="q-pa-md">
          <div class="q-gutter-md">
            <q-input
              v-model="preset.title"
              :label="t('templates.name')"
            />
            <q-list
              bordered
              dense
            >
              <q-item
                v-for="column in preset.columns"
                :key="column.name"
              >
                <q-item-section>
                  <q-input label="Name" />
                </q-item-section>
                <q-item-section>
                  <q-input label="Label" />
                </q-item-section>
                <q-item-section>
                  <q-select
                    :options="['left', 'right', 'center']"
                    label="Align"
                  />
                </q-item-section>
                <q-item-section>
                  <q-select
                    :options="['gender', 'age', 'email']"
                    label="TableCellRenderer"
                  />
                </q-item-section>
                <q-item-section style="max-width: 20px">
                  <q-btn
                    dense
                    flat
                    icon="arrow_upward"
                    outline
                    size="xs"
                    square
                  />
                  <q-btn
                    dense
                    flat
                    icon="arrow_downward"
                    outline
                    size="xs"
                    square
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-btn
                    color="primary"
                    icon="add"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-form>
    </div>
    <!-- content -->
  </q-page>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { TableTemplate } from 'src/types/TableTemplate';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';

const { t } = useI18n();
const q = useQuasar();

const preset = ref<TableTemplate>({
  id: 0,
  title: '',
  columns: [],
  order: 0,
});

const edit = ref<boolean>(false);
const editFullScreen = computed<boolean>(() => {
  return q.screen.sm || q.screen.xs;
});

// TODO Load presets instead
const presets = ref<TableTemplate[]>([]);

function showEditPreset(value: TableTemplate): void {
  edit.value = true;
  preset.value = value;
}
</script>

<i18n>
{
  "en": {
    "columns": "Columns",
    "preset": {
      "name": "Name"
    },
    "title": "Edit Table Presets"
  }
}
</i18n>
