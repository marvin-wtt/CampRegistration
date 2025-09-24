import type { Registration } from '@camp-registration/common/entities';
import type {
  Token,
  TokenRegistry,
} from 'components/campManagement/contact/TokenRegistry';

type Dot<S extends string> = S extends '' ? '' : `.${S}`;

type Paths<T, P extends string = ''> =
  // arrays → "prop.[number]" (+ recurse inside element if it's an object)
  T extends readonly (infer U)[]
    ?
        | `${P}.[${number}]`
        | (U extends object ? `${P}.[${number}]${Dot<Paths<U>>}` : never)
    : T extends (infer U)[] // non-readonly variant
      ?
          | `${P}.[${number}]`
          | (U extends object ? `${P}.[${number}]${Dot<Paths<U>>}` : never)
      : // objects → union over keys
        T extends object
        ? {
            [K in keyof T & string]: Paths<
              T[K],
              P extends '' ? K : `${P}.${K}`
            >;
          }[keyof T & string]
        : // primitives → the accumulated path itself
          P;

export type RegistrationComputedPath = Paths<Registration['computedData']>;
export type RegistrationDataPath = string;

export interface TokenValue<TPath extends string> extends Token {
  label: string;
  value: TPath;
  caption?: string;
  category?: string | undefined;
}

export interface TokenNode<TPath extends string> extends TokenRegistry {
  label?: string;
  caption?: string;
  category?: string | undefined;
  icon?: string;
  value: string; // group/category key like "registration" | "computedData" ...
  items: TokenNode<TPath>[] | TokenValue<TPath>[];
}
