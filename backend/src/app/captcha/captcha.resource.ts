import type { CaptchaClientConfig } from '@camp-registration/common/captcha';
import { JsonResource } from '#core/resource/JsonResource';

export class CaptchaConfigResource extends JsonResource<
  CaptchaClientConfig,
  CaptchaClientConfig
> {
  transform(): CaptchaClientConfig {
    return this.data;
  }
}
