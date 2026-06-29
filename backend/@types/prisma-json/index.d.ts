declare global {
  namespace PrismaJson {
    type Translatable<T> = Record<string, T> | T;
    type StringOrTranslation = Translatable<string>;
    type NumberOrTranslation = Translatable<number>;
    type GenericObject = Record<string, unknown>;

    type RegistrationCampData = Record<string, unknown[]>;

    // Names of the fields that changed (`status`, `data.allergies`, …) — never
    // their values. Null for create/delete events.
    type AuditChangedFields = string[];
  }
}
