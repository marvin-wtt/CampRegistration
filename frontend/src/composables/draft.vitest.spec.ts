import { describe, expect, it } from 'vitest';
import { nextTick, shallowRef } from 'vue';
import { useDraft } from '@/composables/draft';

interface Item {
  name: string;
  tags: string[];
}

function setup(initial?: Item) {
  const source = shallowRef<Item | undefined>(initial);
  const draft = useDraft(() => source.value, {
    toDraft: (item) => structuredClone(item),
  });
  return { source, ...draft };
}

describe('useDraft', () => {
  it('starts as a copy of the source', () => {
    const { source, draft, isModified } = setup({ name: 'a', tags: [] });

    expect(draft.value).toEqual({ name: 'a', tags: [] });
    expect(draft.value).not.toBe(source.value);
    expect(isModified.value).toBe(false);
  });

  it('follows the source while unedited', async () => {
    const { source, draft } = setup();

    source.value = { name: 'loaded', tags: [] };
    await nextTick();

    expect(draft.value?.name).toBe('loaded');
  });

  it('keeps edits when the source changes', async () => {
    const { source, draft, isModified } = setup({ name: 'a', tags: [] });
    draft.value!.name = 'edited';

    source.value = { name: 'reloaded', tags: [] };
    await nextTick();

    expect(draft.value?.name).toBe('edited');
    expect(isModified.value).toBe(true);
  });

  it('counts an edit undone by hand as unmodified', () => {
    const { draft, isModified } = setup({ name: 'a', tags: ['x'] });

    draft.value!.tags.push('y');
    expect(isModified.value).toBe(true);
    draft.value!.tags.pop();
    expect(isModified.value).toBe(false);
  });

  it('takes the current source on reset, before any watcher ran', () => {
    const { source, draft, isModified, reset } = setup({ name: 'a', tags: [] });
    draft.value!.name = 'edited';

    source.value = { name: 'saved', tags: [] };
    reset();

    expect(draft.value?.name).toBe('saved');
    expect(isModified.value).toBe(false);
  });

  it('compares what normalize keeps', () => {
    const source = shallowRef({ name: 'a', tags: [] as string[] });
    const { draft, isModified } = useDraft(() => source.value, {
      toDraft: (item) => structuredClone(item),
      normalize: ({ name }) => name.trim(),
    });

    draft.value!.name = 'a  ';
    expect(isModified.value).toBe(false);
  });
});
