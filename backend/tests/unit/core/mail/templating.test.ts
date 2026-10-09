import { describe, expect, it } from 'vitest';
import { renderTemplate, SafeHtml, TemplateError } from '#core/mail/templating';

describe('renderTemplate', () => {
  it('escapes inserted values in html', () => {
    expect(
      renderTemplate('<p>{{ name }}</p>', { name: "<b>O'Neil</b>" }, 'html'),
    ).toBe('<p>&lt;b&gt;O&#x27;Neil&lt;/b&gt;</p>');
  });

  it('inserts values as they are in text', () => {
    expect(
      renderTemplate('Hi {{ name }}', { name: "O'Neil & co" }, 'text'),
    ).toBe("Hi O'Neil & co");
  });

  it('emits our own markup without escaping it again', () => {
    const list = new SafeHtml('<ul><li>a</li></ul>');

    expect(renderTemplate('{{ list }}', { list }, 'html')).toBe(
      '<ul><li>a</li></ul>',
    );
  });

  it('allows the built-in blocks', () => {
    expect(
      renderTemplate('{{#if ok}}yes{{else}}no{{/if}}', { ok: false }, 'html'),
    ).toBe('no');
  });

  it.each([
    { name: 'an unclosed block', source: '{{#if ok}}yes' },
    { name: 'an unknown helper', source: '{{shout name}}' },
    { name: 'a partial', source: '{{> header}}' },
  ])('throws a TemplateError for $name', ({ source }) => {
    expect(() =>
      renderTemplate(source, { ok: true, name: 'x' }, 'html'),
    ).toThrow(TemplateError);
  });
});
