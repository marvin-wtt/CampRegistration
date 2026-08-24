declare global {
  namespace PrismaJson {
    type Translatable<T> = Record<string, T> | T;
    type StringOrTranslation = Translatable<string>;
    type NumberOrTranslation = Translatable<number>;
    type GenericObject = Record<string, unknown>;

    type RegistrationEventData = Record<string, unknown[]>;

    type PrivacyNoticeContent =
      import('@camp-registration/common/privacy').PrivacyNoticeContent;
    type PrivacyNoticeAddendum =
      import('@camp-registration/common/privacy').PrivacyNoticeAddendum;
  }
}
