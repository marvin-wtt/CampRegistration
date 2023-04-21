<template>
  <q-item>
    <q-item-section>
      <q-item-label>
        <q-skeleton
          type="text"
          width="10rem"
        />
      </q-item-label>
    </q-item-section>

    <q-item-section side>
      <div class="q-gutter-xs">
        <!--        <q-skeleton-->
        <!--          v-if="!props.public"-->
        <!--          type="QBtn"-->
        <!--          class="gt-xs"-->
        <!--        />-->

        <!--        <q-skeleton-->
        <!--          v-if="!props.public"-->
        <!--          type="QBtn"-->
        <!--          class="gt-sm"-->
        <!--        />-->

        <!--        <q-skeleton-->
        <!--          type="QBtn"-->
        <!--          class="gt-xs"-->
        <!--        />-->

        <!--        <q-skeleton-->
        <!--          type="QBtn"-->
        <!--          class="gt-sm"-->
        <!--        />-->

        <!--        <q-skeleton-->
        <!--          v-if="!props.public"-->
        <!--          type="QBtn"-->
        <!--          class="gt-sm"-->
        <!--        />-->

        <!--        <q-skeleton-->
        <!--          v-if="!props.public"-->
        <!--          type="QBtn"-->
        <!--          class="gt-sm"-->
        <!--        />-->

        <!--        <q-skeleton-->
        <!--          type="QBtn"-->
        <!--          class="lt-md"-->
        <!--        />-->
      </div>
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
  public?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  public: false,
});
</script>

<style scoped></style>
