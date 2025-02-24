import { Node, mergeAttributes, InputRule, PasteRule } from '@tiptap/core';

export interface VariableDefinition {
  value: string;
  label: string;
  category?: string | undefined;
}

export type VariableList = VariableDefinition[];

export interface VariableOptions {
  HTMLAttributes: Record<string, unknown>;
  // A list of allowed variables provided as an array of objects.
  variables: VariableList;
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

const VARIABLE_INPUT_REGEX = /({{\s*)([a-zA-Z0-9_.]+)?(\s*}})$/;
const VARIABLE_PASTE_REGEX = /({{\s*([a-zA-Z0-9_.]+)\s*}})/g;

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
    };
  },

  addAttributes() {
    return {
      value: {
        default: null,
        parseHTML: function (element) {
          return element.getAttribute('data-value');
        },
        renderHTML: (attributes) => {
          if (!attributes.value) return {};
          return { 'data-value': attributes.value };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span.variable[data-value]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { value } = node.attrs;
    const { label, category } = resolveProperties(
      this.options.variables,
      value,
    );

    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-value': value,
        'data-label': label,
        'data-category': category,
        'aria-label': `${category} | ${label}`,
      }),
      // Optionally display the category.
      category
        ? ['span', { class: 'variable-category' }, `${category} | `]
        : '',
      // Variable label element.
      ['span', { class: 'variable-label' }, label],
    ];
  },

  renderText({ node }) {
    const { value } = node.attrs;
    return `{{ ${value} }}`;
  },

  addCommands() {
    return {
      insertVariable:
        (options) =>
        ({ commands }) => {
          const { label, category } = resolveProperties(
            this.options.variables,
            options.value,
          );
          return commands.insertContent({
            type: this.name,
            attrs: { value: options.value, label, category },
          });
        },
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
          const { label, category } = resolveProperties(
            this.options.variables,
            value,
          );
          state.tr.replaceWith(
            range.from,
            range.to,
            this.type.create({ value, label, category }),
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
          const { label, category } = resolveProperties(
            this.options.variables,
            value,
          );
          state.tr.replaceWith(
            range.from,
            range.to,
            this.type.create({ value, label, category }),
          );
        },
      }),
    ];
  },
});

export default Variable;
