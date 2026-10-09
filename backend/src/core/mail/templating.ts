import Handlebars from 'handlebars';
import { describeError } from '#utils/errors';

// The one place that knows which template engine renders manager-written
// subjects and bodies; everything else goes through this API.

/** A template that can't be rendered: a fault of whoever wrote it. */
export class TemplateError extends Error {}

/** Markup built (and escaped) by us, emitted into an HTML template as is. */
export class SafeHtml {
  constructor(private readonly html: string) {}

  // The engine emits what `toHTML` returns without escaping it again.
  toHTML(): string {
    return this.html;
  }

  toString(): string {
    return this.html;
  }
}

export function escapeHtml(value: string): string {
  return Handlebars.escapeExpression(value);
}

/**
 * Renders a template against `context`. `html` escapes the values it inserts;
 * `text` doesn't, for subjects and other plain text. Only the built-in blocks
 * are allowed: no custom helpers, no partials.
 *
 * @throws TemplateError when the template is malformed or uses an unknown helper.
 */
export function renderTemplate(
  source: string,
  context: object,
  format: 'html' | 'text',
): string {
  let ast: hbs.AST.Program;
  try {
    ast = Handlebars.parse(source);
  } catch (error) {
    // The parser throws plain `Error`s.
    throw new TemplateError(describeError(error));
  }

  const render = Handlebars.compile(ast, {
    noEscape: format === 'text',
    knownHelpersOnly: true,
    knownHelpers: {
      if: true,
      unless: true,
      each: true,
      with: true,
    },
  });

  try {
    return render(context);
  } catch (error) {
    // Compiling is deferred to the first render, which is where unknown
    // helpers are found.
    if (error instanceof Handlebars.Exception) {
      throw new TemplateError(error.message);
    }
    throw error;
  }
}
