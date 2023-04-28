<template>
  <q-menu>
    <q-list style="min-width: 100px">
      <q-item
        v-if="props.public"
        v-close-popup
        clickable
        @click="emit('share')"
      >
        <q-item-section avatar>
          <q-icon name="share" />
        </q-item-section>
        <q-item-section>
          <q-item-label>
            {{ t('action.share') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item
        v-close-popup
        clickable
        @click="emit('results')"
      >
        <q-item-section avatar>
          <q-icon name="view_list" />
        </q-item-section>
        <q-item-section>
          <q-item-label>
            {{ t('action.camp-management') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item
        v-close-popup
        clickable
        @click="emit('edit')"
      >
        <q-item-section avatar>
          <q-icon name="edit" />
        </q-item-section>
        <q-item-section>
          <q-item-label>
            {{ t('action.edit') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item
        v-if="props.public"
        v-close-popup
        v-ripple
        class="text-warning"
        clickable
        @click="emit('unpublish')"
      >
        <q-item-section avatar>
          <q-icon name="unpublished" />
        </q-item-section>
        <q-item-section>
          <q-item-label>
            {{ t('action.unpublish') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item
        v-if="!props.public"
        v-close-popup
        v-ripple
        class="text-warning"
        clickable
        @click="emit('publish')"
      >
        <q-item-section avatar>
          <q-icon name="publish" />
        </q-item-section>
        <q-item-section>
          <q-item-label>
            {{ t('action.publish') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item
        v-close-popup
        class="text-negative"
        clickable
        @click="emit('delete')"
      >
        <q-item-section avatar>
          <q-icon name="delete" />
        </q-item-section>
        <q-item-section>
          <q-item-label>
            {{ t('action.delete') }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>
<script lang="ts" setup>
import { Camp } from 'src/types/Camp';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
  camp: Camp;
  public?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  public: false,
});

const emit = defineEmits<{
  (e: 'share'): void;
  (e: 'results'): void;
  (e: 'edit'): void;
  (e: 'publish'): void;
  (e: 'unpublish'): void;
  (e: 'delete'): void;
}>();
</script>

<!-- TODO Translate -->
<i18n lang="yaml" locale="en">
action:
  create: 'Create new'
  delete: 'Delete'
  edit: 'Edit'
  publish: 'Publish'
  results: 'Results'
  share: 'Share'
  unpublish: 'Unpublish'
</i18n>
