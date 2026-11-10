<template>
  <div class="column no-wrap">
    <q-input
      ref="inputRef"
      :model-value="modelValue ?? ''"
      :label
      :hint="t('hint')"
      type="textarea"
      autogrow
      outlined
      rounded
      class="notes-input"
      data-test="task-notes-input"
      @update:model-value="(value) => (modelValue = String(value ?? ''))"
      @keydown.enter="onEnter"
    >
      <template #prepend>
        <q-icon name="description" />
      </template>
    </q-input>
    <div class="row items-center q-gutter-x-xs q-mt-xs notes-toolbar">
      <q-btn
        v-for="option in listOptions"
        :key="option.kind"
        :icon="option.icon"
        :label="option.label"
        :data-test="`task-notes-${option.kind}`"
        color="primary"
        size="sm"
        flat
        rounded
        no-caps
        @click="applyList(option.kind)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QInput } from 'quasar';
import {
  LIST_PREFIX,
  type ListKind,
  parseLine,
  setLinePrefix,
} from '@/utils/taskNotes';

const { label } = defineProps<{
  label: string;
}>();

const modelValue = defineModel<string | null | undefined>();

const { t } = useI18n();

const inputRef = useTemplateRef<QInput>('inputRef');

const listOptions = computed<{ kind: ListKind; icon: string; label: string }[]>(
  () => [
    {
      kind: 'checklist',
      icon: 'checklist',
      label: t('action.checklist'),
    },
    {
      kind: 'bullets',
      icon: 'format_list_bulleted',
      label: t('action.bullets'),
    },
  ],
);

function textarea(): HTMLTextAreaElement | undefined {
  return inputRef.value?.getNativeElement() as HTMLTextAreaElement | undefined;
}

async function write(value: string, caret: number) {
  modelValue.value = value;
  await nextTick();
  const el = textarea();
  el?.focus();
  el?.setSelectionRange(caret, caret);
}

// Toggles the list kind on every line the selection touches.
function applyList(kind: ListKind) {
  const value = modelValue.value ?? '';
  const el = textarea();
  const start = el?.selectionStart ?? value.length;
  const end = el?.selectionEnd ?? value.length;

  const from = value.lastIndexOf('\n', start - 1) + 1;
  const nextBreak = value.indexOf('\n', end);
  const to = nextBreak === -1 ? value.length : nextBreak;

  const lines = value.slice(from, to).split('\n');
  const allOfKind = lines.every((line) => parseLine(line).kind === kind);
  const replaced = lines
    .map((line) => setLinePrefix(line, allOfKind ? null : kind))
    .join('\n');

  void write(
    value.slice(0, from) + replaced + value.slice(to),
    from + replaced.length,
  );
}

// Enter continues a list; Enter on an empty item ends it.
function onEnter(event: KeyboardEvent) {
  if (event.shiftKey || event.isComposing) {
    return;
  }

  const el = textarea();
  const value = modelValue.value ?? '';
  if (!el || el.selectionStart !== el.selectionEnd) {
    return;
  }

  const caret = el.selectionStart;
  const from = value.lastIndexOf('\n', caret - 1) + 1;
  const parsed = parseLine(value.slice(from, caret));
  if (parsed.kind === 'text') {
    return;
  }

  event.preventDefault();

  if (parsed.text.trim() === '') {
    void write(value.slice(0, from) + value.slice(caret), from);
    return;
  }

  const insert = `\n${LIST_PREFIX[parsed.kind]}`;
  void write(
    value.slice(0, caret) + insert + value.slice(caret),
    caret + insert.length,
  );
}
</script>

<style scoped>
.notes-toolbar {
  margin-left: 4px;
}
</style>

<i18n lang="yaml" locale="en">
hint: 'Start a line with "- " for a bullet or "- [ ] " for a checklist item'
action:
  checklist: 'Checklist'
  bullets: 'Bullet list'
</i18n>

<i18n lang="yaml" locale="de">
hint: 'Beginne eine Zeile mit „- “ für einen Aufzählungspunkt oder „- [ ] “ für einen Checklisten-Punkt'
action:
  checklist: 'Checkliste'
  bullets: 'Aufzählung'
</i18n>

<i18n lang="yaml" locale="fr">
hint: 'Commence une ligne par « - » pour une puce ou « - [ ] » pour un élément de checklist'
action:
  checklist: 'Checklist'
  bullets: 'Liste à puces'
</i18n>

<i18n lang="yaml" locale="pl">
hint: 'Zacznij wiersz od „- ”, aby dodać punktor, lub od „- [ ] ”, aby dodać pozycję listy kontrolnej'
action:
  checklist: 'Lista kontrolna'
  bullets: 'Lista punktowana'
</i18n>

<i18n lang="yaml" locale="cs">
hint: 'Začni řádek „- “ pro odrážku nebo „- [ ] “ pro položku kontrolního seznamu'
action:
  checklist: 'Kontrolní seznam'
  bullets: 'Odrážky'
</i18n>
