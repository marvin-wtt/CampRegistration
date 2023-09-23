export interface SurveyJSCampData {
  title: string | Record<string, string>;
  description: string | Record<string, string>;
  locale?: string;
  pages: Page[];
}

export interface Page {
  name: string;
  description?: string | Record<string, string>;
  title?: string | Record<string, string>;
  elements: AnyElement[];
  visible?: boolean;
  required?: boolean;
  readOnly?: boolean;
  visibleIf?: string;
  readOnlyIf?: string;
  requiredIf?: string;
}

export type AnyElement =
  | TextElement
  | SelectionElement
  | FileElement
  | ExpressionElement;

export interface Element {
  name: string;
  valueName?: string;
  type: string;
  title: string | Record<string, string>;
  description?: string | Record<string, string>;
  visible?: boolean;
  required?: boolean;
  readOnly?: boolean;
  visibleIf?: string;
  readOnlyIf?: string;
  requiredIf?: string;
  requiredErrorText?: string;

  [key: string]:
    | undefined
    | string
    | boolean
    | number
    | Record<string, string>
    | { text: string | Record<string, string>; value: unknown }[];
}

export interface TextElement extends Element {
  type: 'text';
  // TODO Maybe covert these types? Or ignore them
  inputType?: // | 'color'
  | 'date'
    // | 'datetime'
    | 'email'
    | 'number'
    | 'password'
    // | 'range'
    | 'text'
    // | 'time'
    | 'url';

  min?: number | string;
  max?: number | string;

  minErrorText?: string;
  maxErrorText?: string;
}

export interface SelectionElement extends Element {
  type: 'radiogroup' | 'checkbox' | 'dropdown';
  choices: {
    text: string | Record<string, string>;
    value: unknown;
  }[];
}

export interface FileElement extends Element {
  type: 'file';
  allowMultiple?: boolean;
  acceptedTypes?: string;
  maxSize?: number;
}

export interface ExpressionElement extends Element {
  type: 'expression';
}
