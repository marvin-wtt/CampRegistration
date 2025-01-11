<template>
  <q-separator v-if="props.separated" />

  <q-item-label
    v-if="props.header"
    header
  >
    {{ props.label }}
  </q-item-label>

  <q-item
    v-else-if="!props.children || props.children.length === 0"
    v-ripple
    :to="props.to"
    clickable
    :disable="disabled"
  >
    <q-item-section
      v-if="props.icon"
      avatar
    >
      <q-icon :name="props.icon" />
    </q-item-section>

    <q-item-section>
      <q-badge
        v-if="props.preview"
        align="top"
        floating
        rounded
      >
        Preview
      </q-badge>
      {{ props.label }}
    </q-item-section>
  </q-item>

  <q-expansion-item
    v-else
    v-model="expanded"
    expand-separator
    :icon="props.icon"
    :label="props.label"
    :to="props.to"
    @click.prevent="expanded = !expanded"
  >
    <navigation-item
      v-for="child in props.children"
      :key="child.name"
      :name="child.name"
      :label="child.label"
      :icon="child.icon"
      :to="child.to"
      :separated="child.separated"
      :children="child.children"
      :insert-level="0.2"
      :preview="child.preview"
    />
  </q-expansion-item>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { NavigationItemProps } from 'components/NavigationItemProps.ts';

const route = useRoute();

const props = defineProps<NavigationItemProps>();

const disabled = computed<boolean>(() => {
  return !props.header && props.to === undefined;
});

const expanded = ref<boolean>(isExpanded());

function isExpanded(): boolean {
  if (props.header) {
    return false;
  }

  return (
    matchNavigationToRoute(props.to) ||
    props.children?.some((child) => matchNavigationToRoute(child.to)) ||
    false
  );
}

function matchNavigationToRoute(to?: string | object): boolean {
  if (to === undefined) {
    return false;
  }

  if (typeof to === 'string') {
    return route.path === to;
  }

  if ('path' in to) {
    return route.path === to.path;
  }

  if ('name' in to) {
    return route.name === to.name;
  }

  return false;
}
</script>

<style scoped></style>
