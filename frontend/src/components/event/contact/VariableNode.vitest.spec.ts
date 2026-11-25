import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Variable, {
  cleanFallback,
  parseVariable,
  variableSource,
} from './VariableNode';

describe('parseVariable', () => {
  it('reads a plain variable', () => {
    expect(parseVariable('{{ registration.computedData.firstName }}')).toEqual({
      value: 'registration.computedData.firstName',
      fallback: null,
    });
  });

  it('reads a variable with a fallback', () => {
    expect(
      parseVariable(
        '{{#if event.name}}{{ event.name }}{{else}}our camp{{/if}}',
      ),
    ).toEqual({ value: 'event.name', fallback: 'our camp' });
  });

  it('rejects a block whose value differs from its condition', () => {
    expect(
      parseVariable('{{#if event.name}}{{ event.location }}{{else}}x{{/if}}'),
    ).toBeNull();
  });

  it('does not take `else` for a variable', () => {
    expect(parseVariable('{{else}}')).toBeNull();
  });
});

describe('variableSource', () => {
  it.each([
    { value: 'event.name', fallback: null },
    { value: 'registration.computedData.emails.[0]', fallback: 'du' },
  ])('round-trips %j', (attrs) => {
    expect(parseVariable(variableSource(attrs))).toEqual(attrs);
  });
});

describe('cleanFallback', () => {
  it('strips what would break the template', () => {
    expect(cleanFallback(' {{a}} <b> ')).toBe('a b');
  });
});

let editor: Editor | undefined;

afterEach(() => {
  editor?.destroy();
});

describe('Variable node', () => {
  it('keeps a fallback through HTML', () => {
    const source =
      '{{#if registration.computedData.firstName}}{{ registration.computedData.firstName }}{{else}}du{{/if}}';
    editor = new Editor({
      extensions: [StarterKit, Variable],
      content: `<p>Hallo <span data-variable>${source}</span></p>`,
    });

    expect(editor.getHTML()).toBe(
      `<p>Hallo <span data-variable="true">${source}</span></p>`,
    );
  });
});
