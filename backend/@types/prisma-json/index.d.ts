declare global {
  namespace PrismaJson {
    import { TableTemplate } from '@camp-registration/common/entities';
    type TableTemplates = TableTemplate[];

    type Translatable<T> = Record<string, T> | T;
    type StringOrTranslation = Translatable<string>;
    type NumberOrTranslation = Translatable<number>;
    type GenericObject = Record<string, unknown>;

    type RegistrationCampData = Record<string, unknown[]>;
  }
}
