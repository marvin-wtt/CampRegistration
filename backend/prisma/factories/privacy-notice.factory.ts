import {
  emptyPrivacyNoticeContent,
  type PrivacyNoticeAddendum,
  type PrivacyNoticeContent,
} from '@camp-registration/common/privacy';
import prisma from '../client.js';

/**
 * The smallest notice `privacyNoticeCompleteness` accepts. Factories build a
 * verifiable organization by default, so this has to stay complete — if a gap
 * rule is added to `common`, this is the one place to satisfy it.
 */
export const completePrivacyNoticeContent = (
  data: Partial<PrivacyNoticeContent> = {},
): PrivacyNoticeContent => ({
  ...emptyPrivacyNoticeContent(),
  purposes: [{ key: 'registration_administration', legalBasis: 'contract' }],
  dataCategories: [{ key: 'identity' }, { key: 'contact' }],
  recipients: [{ key: 'camp_staff' }, { key: 'platform_operator' }],
  retention: { months: 24, anchor: 'camp_end', exceptions: [] },
  ...data,
});

export const PrivacyNoticeFactory = {
  /** A published organization notice — the only state there is. */
  createPublished: async (
    organizationId: string,
    content: PrivacyNoticeContent = completePrivacyNoticeContent(),
  ) => {
    return prisma.privacyNoticeVersion.create({
      data: {
        scope: 'ORGANIZATION',
        scopeId: organizationId,
        version: 1,
        content,
      },
    });
  },

  createCampAddendum: async (
    campId: string,
    content: PrivacyNoticeAddendum,
    version = 1,
  ) => {
    return prisma.privacyNoticeVersion.create({
      data: { scope: 'CAMP', scopeId: campId, version, content },
    });
  },
};
