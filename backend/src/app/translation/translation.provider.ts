/**
 * Base class for machine-translation providers. Concrete providers pull their
 * own credentials from `config.translation.<name>` (see `#config/index`)
 * rather than receiving them through the constructor, mirroring how queue
 * drivers self-configure (`#core/queue`).
 */
export abstract class TranslationProvider {
  public abstract readonly name: string;

  /**
   * Translate `text` into `targetLocale`. `sourceLocale` is a hint; omit it
   * to let the provider auto-detect the source language.
   */
  public abstract translate(
    text: string,
    targetLocale: string,
    sourceLocale?: string,
  ): Promise<string>;
}
