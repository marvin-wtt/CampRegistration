import { Node } from '@tiptap/core';

export interface EmailButtonAttributes {
  href: string;
  label: string;
}

const LINK_RE = /^(?:https?:\/\/\S+|mailto:\S+|tel:\S+)$/i;

/** Whether `href` is a full web, mail or phone link a button may point at. */
export function isButtonLink(href: string): boolean {
  return LINK_RE.test(href.trim());
}

export interface EmailButtonOptions {
  // Resolves with the new attributes, `null` to remove the button, or
  // `undefined` to leave it as it is.
  edit: (
    attrs: EmailButtonAttributes,
  ) => Promise<EmailButtonAttributes | null | undefined>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    emailButton: {
      insertEmailButton: (attrs: EmailButtonAttributes) => ReturnType;
    };
  }
}

// Stored as `<a data-button href="…">Label</a>`; the backend turns it into
// email markup when sending.
const EmailButton = Node.create<EmailButtonOptions>({
  name: 'emailButton',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addOptions() {
    return {
      edit: () => Promise.resolve(undefined),
    };
  },

  addAttributes() {
    return {
      href: {
        default: '',
        parseHTML: (element) => element.getAttribute('href') ?? '',
        rendered: false,
      },
      label: {
        default: '',
        parseHTML: (element) => element.textContent.trim(),
        rendered: false,
      },
    };
  },

  parseHTML() {
    // Ahead of the link mark, which matches any `a[href]`.
    return [{ tag: 'a[data-button]', priority: 100 }];
  },

  renderHTML({ node }) {
    const { href, label } = node.attrs as EmailButtonAttributes;

    return ['a', { 'data-button': '', href }, label];
  },

  renderText({ node }) {
    const { href, label } = node.attrs as EmailButtonAttributes;

    return `${label}: ${href}`;
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      let current = node;

      const dom = document.createElement('div');
      dom.classList.add('email-button');
      const label = document.createElement('span');
      label.classList.add('email-button__label');
      const target = document.createElement('span');
      target.classList.add('email-button__target');
      dom.append(label, target);

      const render = () => {
        const attrs = current.attrs as EmailButtonAttributes;
        label.textContent = attrs.label;
        target.textContent = attrs.href;
      };
      render();

      dom.addEventListener('click', () => {
        if (!editor.isEditable) {
          return;
        }

        void this.options
          .edit(current.attrs as EmailButtonAttributes)
          .then((attrs) => {
            const pos = getPos();
            if (attrs === undefined || pos === undefined) {
              return;
            }

            editor
              .chain()
              .focus()
              .command(({ tr }) => {
                if (attrs === null) {
                  tr.delete(pos, pos + current.nodeSize);
                } else {
                  tr.setNodeMarkup(pos, undefined, attrs);
                }
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

  addCommands() {
    return {
      insertEmailButton:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});

export default EmailButton;
