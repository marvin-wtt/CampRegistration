declare global {
  namespace PrismaJson {
    type Translatable<T> = Record<string, T> | T;
    type StringOrTranslation = MaybeTranslation<string>;
    type NumberOrTranslation = MaybeTranslation<number>;
    type GenericObject = Record<string, unknown>;

    type RegistrationCampData = Record<string, unknown[]>;
  }
}
