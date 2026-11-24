import { Node, mergeAttributes, InputRule, PasteRule } from '@tiptap/core';

export interface VariableDefinition {
  value: string;
  label: string;
  category?: string | undefined;
  type?: 'url' | undefined;
}

export type VariableList = VariableDefinition[];

export interface VariableAttributes {
  value: string;
  // Printed instead when the value is empty.
  fallback: string | null;
}

interface VariableOptions {
  HTMLAttributes: Record<string, unknown>;
  // A list of allowed variables provided as an array of objects.
  variables: VariableList;
  // Resolves with the new fallback, or `undefined` to leave it as it is.
  edit: (attrs: VariableAttributes) => Promise<string | null | undefined>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    variable: {
      /**
       * Insert a variable node. When inserted, the node will load its label and category
       * from the configured variable list if an entry exists for the given value.
       */
      insertVariable: (options: { value: string }) => ReturnType;
    };
  }
}

const PATH = String.raw`[a-zA-Z0-9_.[\]]+`;
// `{{ else }}` belongs to a block, it's no variable.
const PLAIN = String.raw`\{\{\s*(?!else\b)(?<path>${PATH})\s*\}\}`;
const WITH_FALLBACK = String.raw`\{\{#if (?<fallbackPath>${PATH})\}\}\{\{\s*\k<fallbackPath>\s*\}\}\{\{else\}\}(?<fallback>[^{}<>]*)\{\{\/if\}\}`;

/** A variable as a template writes it, with or without a fallback. */
export const VARIABLE_SOURCE = `(?:${WITH_FALLBACK}|${PLAIN})`;

const VARIABLE_EXACT = new RegExp(`^${VARIABLE_SOURCE}$`);

export function parseVariable(source: string): VariableAttributes | null {
  const groups = VARIABLE_EXACT.exec(source.trim())?.groups;
  if (!groups) {
    return null;
  }

  return groups.fallbackPath
    ? { value: groups.fallbackPath, fallback: groups.fallback ?? '' }
    : { value: groups.path ?? '', fallback: null };
}

/** Braces and angle brackets would end the template block or read as a tag. */
export function cleanFallback(text: string): string {
  return text.replace(/[{}<>]/g, '').trim();
}

export function variableSource({ value, fallback }: VariableAttributes) {
  return fallback
    ? `{{#if ${value}}}{{ ${value} }}{{else}}${fallback}{{/if}}`
    : `{{ ${value} }}`;
}

// Helper function to resolve label and category based on a variable value.
function resolveProperties(
  variables: VariableDefinition[],
  value: string,
): { label: string | null; category: string | null } {
  const found = variables.find((item) => item.value === value);
  return found
    ? { label: found.label, category: found.category ?? null }
    : { label: value, category: null };
}

const VARIABLE_INPUT_REGEX = /({{\s*)(?!else\b)([a-zA-Z0-9_.[\]]+)?(\s*}})$/;
const VARIABLE_PASTE_REGEX = /({{\s*(?!else\b)([a-zA-Z0-9_.[\]]+)\s*}})/g;

const Variable = Node.create<VariableOptions>({
  name: 'variable',
  group: 'inline',
  inline: true,
  selectable: false,
  draggable: true,
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'variable',
      },
      variables: [] as VariableList,
      edit: () => Promise.resolve(undefined),
    };
  },

  addAttributes() {
    return {
      value: {
        default: null,
        parseHTML: (element) =>
          parseVariable(element.textContent ?? '')?.value ?? null,
        renderHTML: () => ({}),
      },
      fallback: {
        default: null,
        parseHTML: (element) =>
          parseVariable(element.textContent ?? '')?.fallback ?? null,
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-variable]',
      },
    ];
  },

  renderHTML({ node }) {
    return [
      'span',
      { 'data-variable': true },
      variableSource(node.attrs as VariableAttributes),
    ];
  },

  addNodeView() {
    return ({ node, editor, getPos, HTMLAttributes }) => {
      let current = node;

      const dom = document.createElement('span');
      dom.classList.add('variable');

      const render = () => {
        const { value, fallback } = current.attrs as VariableAttributes;
        const { label, category } = resolveProperties(
          this.options.variables,
          value,
        );

        const attrs = mergeAttributes(
          this.options.HTMLAttributes,
          HTMLAttributes,
          {
            'aria-label': [category, label, fallback]
              .filter(Boolean)
              .join(' | '),
          },
        );
        for (const [name, val] of Object.entries(attrs)) {
          dom.setAttribute(name, val);
        }

        dom.replaceChildren();
        if (category) {
          const categoryEl = document.createElement('span');
          categoryEl.textContent = category;
          categoryEl.classList.add('variable-category');
          dom.append(categoryEl);
        }

        const labelEl = document.createElement('span');
        labelEl.textContent = label ?? value;
        labelEl.classList.add('variable-label');
        dom.append(labelEl);

        if (fallback) {
          const fallbackEl = document.createElement('span');
          fallbackEl.textContent = fallback;
          fallbackEl.classList.add('variable-fallback');
          dom.append(fallbackEl);
        }
      };
      render();

      dom.addEventListener('click', () => {
        if (!editor.isEditable) {
          return;
        }

        void this.options
          .edit(current.attrs as VariableAttributes)
          .then((fallback) => {
            const pos = getPos();
            if (fallback === undefined || pos === undefined) {
              return;
            }

            editor
              .chain()
              .focus()
              .command(({ tr }) => {
                tr.setNodeMarkup(pos, undefined, {
                  ...current.attrs,
                  fallback: fallback ? cleanFallback(fallback) || null : null,
                });
                return true;
              })
              .run();
          });
      });

      return {
        dom,
        update: (updated) => {
          if (updated.type !== current.type) {
            return false;
          }
          current = updated;
          render();
          return true;
        },
      };
    };
  },

  renderText({ node }) {
    return variableSource(node.attrs as VariableAttributes);
  },

  addCommands() {
    return {
      insertVariable:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { value: options.value, fallback: null },
          }),
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: VARIABLE_INPUT_REGEX,
        handler: ({ state, range, match }) => {
          const value = match[2];
          if (!value) {
            return;
          }
          state.tr.replaceWith(
            range.from,
            range.to,
            this.type.create({ value, fallback: null }),
          );
        },
      }),
    ];
  },

  addPasteRules() {
    return [
      new PasteRule({
        find: VARIABLE_PASTE_REGEX,
        handler: ({ state, range, match }) => {
          const value = match[2];
          if (!value) {
            return;
          }
          state.tr.replaceWith(
            range.from,
            range.to,
            this.type.create({ value, fallback: null }),
          );
        },
      }),
    ];
  },
});

export default Variable;
