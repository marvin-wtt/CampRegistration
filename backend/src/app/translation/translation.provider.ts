import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';

const MAX_LOGGED_BODY_LENGTH = 1000;

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

  // The upstream status and body go into `cause` only, which reaches the logs
  // but is never sent to the client.
  protected async requestFailedError(
    response: Response,
    targetLocale: string,
    sourceLocale?: string,
  ): Promise<ApiError> {
    const body = await response.text().catch(() => '');
    const detail = body.slice(0, MAX_LOGGED_BODY_LENGTH);

    return new ApiError(
      httpStatus.BAD_GATEWAY,
      'Translation provider request failed.',
      {
        cause: new Error(
          `${this.name} (${sourceLocale ?? 'auto'} -> ${targetLocale}) responded with ${response.status.toString()} ${response.statusText}: ${detail}`,
        ),
        code: 'TRANSLATION_PROVIDER_ERROR',
      },
    );
  }
}
