import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import EmailButton, { isButtonLink } from './ButtonNode';

describe('isButtonLink', () => {
  it.each([
    'https://example.com/pay?id=1',
    'http://example.com',
    'mailto:info@example.com',
    'tel:+491234',
  ])('accepts %s', (href) => {
    expect(isButtonLink(href)).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'example.com',
    '/relative',
    '',
    'https://',
    'https://exa mple.com',
    '{{ payment.url }}',
  ])('rejects %j', (href) => {
    expect(isButtonLink(href)).toBe(false);
  });
});

let editor: Editor | undefined;

function createEditor(content: string): Editor {
  editor = new Editor({
    extensions: [StarterKit, EmailButton],
    content,
  });
  return editor;
}

afterEach(() => {
  editor?.destroy();
  editor = undefined;
});

describe('EmailButton', () => {
  it('parses a stored button and serializes it unchanged', () => {
    const html = '<a data-button="" href="https://example.com/pay">Pay now</a>';

    expect(createEditor(html).getHTML()).toBe(html);
  });

  it('wins over the link mark', () => {
    const json = createEditor(
      '<p>Hi</p><a data-button href="https://example.com">Go</a>',
    ).getJSON();

    expect(json.content?.[1]).toEqual({
      type: 'emailButton',
      attrs: { href: 'https://example.com', label: 'Go' },
    });
  });

  it('keeps a template variable in its href', () => {
    const html = '<a data-button="" href="{{ payment.url }}">Pay</a>';

    expect(createEditor(html).getHTML()).toBe(html);
  });

  it('inserts a button', () => {
    const instance = createEditor('<p>Hi</p>');
    instance.commands.focus('end');
    instance.commands.insertEmailButton({
      href: 'https://example.com',
      label: 'Go',
    });

    expect(instance.getHTML()).toContain(
      '<a data-button="" href="https://example.com">Go</a>',
    );
  });
});
