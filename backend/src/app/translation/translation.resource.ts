import type {
  TranslationResult,
  TranslationStatus,
} from '@camp-registration/common/entities';
import { JsonResource } from '#core/resource/JsonResource';

export class TranslationStatusResource extends JsonResource<
  TranslationStatus,
  TranslationStatus
> {
  transform(): TranslationStatus {
    return {
      available: this.data.available,
    };
  }
}

export class TranslationResultResource extends JsonResource<
  TranslationResult,
  TranslationResult
> {
  transform(): TranslationResult {
    return {
      text: this.data.text,
    };
  }
}
