import { describe, expect, it } from 'vitest';
import { renderEmailLinks } from '#core/mail/links';
import { renderTemplate } from '#core/mail/templating';

const options = { buttonColor: '#123456' };

describe('renderEmailLinks', () => {
  it('expands a button into a table with its link and label', () => {
    const html = renderEmailLinks(
      '<a data-button href="https://example.com/pay">Pay <strong>now</strong></a>',
      options,
    );

    expect(html).toContain('<table role="presentation"');
    expect(html).toContain('bgcolor="#123456"');
    expect(html).toMatch(
      /<a href="https:\/\/example\.com\/pay" target="_blank" style="[^"]+">Pay <strong>now<\/strong><\/a>/,
    );
    expect(html).not.toContain('data-button');
  });

  it('expands every button, whatever the attribute order', () => {
    const html = renderEmailLinks(
      '<a data-button href="https://a.com">A</a><p>x</p><a href="https://b.com" data-button="">B</a>',
      options,
    );

    expect(html.match(/<table/g)).toHaveLength(2);
    expect(html).toContain('href="https://b.com"');
  });

  it('removes a button whose link was dropped or rendered empty', () => {
    expect(
      renderEmailLinks(
        '<a data-button href="javascript:alert(1)">X</a>',
        options,
      ),
    ).toBe('');
    expect(renderEmailLinks('<a data-button href="">X</a>', options)).toBe('');
  });

  it('drops a disallowed scheme that a template value put into a link', () => {
    const rendered = renderTemplate(
      '<p><a href="{{ url }}">Site</a></p>',
      { url: 'javascript:alert(1)' },
      'html',
    );

    expect(renderEmailLinks(rendered, options)).toBe('<p><a>Site</a></p>');
  });

  it('keeps plain links and existing inline styles', () => {
    const html =
      '<p style="text-align:center">See <a href="https://example.com/?a=1&amp;b=2">here</a></p>' +
      '<ul class="registration-changes" style="margin:0"><li><span class="change-value">v</span></li></ul>';

    expect(renderEmailLinks(html, options)).toBe(html);
  });

  it('keeps an escaped label escaped', () => {
    const rendered = renderTemplate(
      '<a data-button href="https://x.com">{{ name }}</a>',
      { name: '<b>x</b>' },
      'html',
    );

    expect(renderEmailLinks(rendered, options)).toContain(
      '>&lt;b&gt;x&lt;/b&gt;</a>',
    );
  });
});
