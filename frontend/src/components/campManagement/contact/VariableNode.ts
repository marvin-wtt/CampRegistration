import { Node, mergeAttributes, InputRule, PasteRule } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

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
    : { label: null, category: null };
}

const VARIABLE_INPUT_REGEX = /(?:^|\s)({{\s*)([a-zA-Z0-9_.]+)?(\s*}})$/;

const Variable = Node.create<VariableOptions>({
  name: 'variable',
  group: 'inline',
  inline: true,
  selectable: false,
  draggable: false,
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

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('variablePreprocessor'),
        appendTransaction: (transactions, oldState, newState) => {
          let tr = newState.tr;
          let modified = false;
          // Traverse the document looking for text nodes.
          newState.doc.descendants((node, pos) => {
            if (node.isText && node.text) {
              const regex = /{{\s*([a-zA-Z0-9_.]+)\s*}}/g;
              let match;
              while ((match = regex.exec(node.text)) !== null) {
                const fullMatch = match[0];
                const variableValue = match[1];
                const start = pos + match.index;
                const end = start + fullMatch.length;
                // Create a variable node with only the value; the label and category will be looked up on render.
                const variableNode = this.type.create({ value: variableValue });
                tr = tr.replaceWith(start, end, variableNode);
                modified = true;
              }
            }
          });
          return modified ? tr : null;
        },
      }),
    ];
  },
});

export default Variable;
