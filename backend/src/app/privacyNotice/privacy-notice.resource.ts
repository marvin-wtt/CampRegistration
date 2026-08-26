import { JsonResource } from '#core/resource/JsonResource';
import {
  privacyNoticeCompleteness,
  type EventPrivacyNotice,
  type OrganizationPrivacyNotice,
  type OrganizationPrivacyNoticeDetails,
  type PublishedPrivacyNotice,
} from '@camp-registration/common/privacy';

/**
 * Carries the completeness result alongside the notice so the wizard's progress
 * meter and the server's publish check can never disagree.
 */
export class OrganizationPrivacyNoticeResource extends JsonResource<
  OrganizationPrivacyNotice,
  OrganizationPrivacyNoticeDetails
> {
  transform(): OrganizationPrivacyNoticeDetails {
    return {
      ...this.data,
      completeness: privacyNoticeCompleteness(this.data.content),
    };
  }
}

/**
 * The event's authoring view. Everything on it is already serialisable — the
 * service resolves the version timestamps — so this is an identity transform
 * kept only so the route returns a resource like every other.
 */
export class EventPrivacyNoticeResource extends JsonResource<
  EventPrivacyNotice,
  EventPrivacyNotice
> {
  transform(): EventPrivacyNotice {
    return this.data;
  }
}

/**
 * The service already assembles exactly what the public page needs, and every
 * field on it is meant to be public — the transform is deliberately an
 * identity rather than a second place to forget a redaction.
 */
export class PublishedPrivacyNoticeResource extends JsonResource<
  PublishedPrivacyNotice,
  PublishedPrivacyNotice
> {
  transform(): PublishedPrivacyNotice {
    return this.data;
  }
}
