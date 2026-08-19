import { api } from '@/services/api';
import type {
  CampPrivacyNotice,
  OrganizationPrivacyNoticeDetails,
  PrivacyNoticeAddendum,
  PrivacyNoticeContent,
  PublishedPrivacyNotice,
} from '@camp-registration/common/privacy';

/**
 * Publishing is the only write on either notice: there is no server-side draft,
 * so an unfinished edit lives in the author's browser and nowhere else.
 */
export function usePrivacyNoticeService() {
  async function fetchOrganizationNotice(
    organizationId: string,
  ): Promise<OrganizationPrivacyNoticeDetails> {
    const response = await api.get(
      `organizations/${organizationId}/privacy-notice/`,
    );

    return response?.data?.data;
  }

  async function publishOrganizationNotice(
    organizationId: string,
    content: PrivacyNoticeContent,
  ): Promise<OrganizationPrivacyNoticeDetails> {
    const response = await api.put(
      `organizations/${organizationId}/privacy-notice/`,
      { content },
    );

    return response?.data?.data;
  }

  /**
   * The composed notice a registrant reads. Published content only — an
   * in-progress edit must not change what the public page says.
   */
  async function fetchCampNotice(
    campId: string,
  ): Promise<PublishedPrivacyNotice> {
    const response = await api.get(`camps/${campId}/privacy-notice/`);

    return response?.data?.data;
  }

  /**
   * The camp's own published additions plus the organization baseline they are
   * added to — the public endpoint above returns the two already merged, which
   * cannot tell an author which half is theirs.
   */
  async function fetchCampAddendum(campId: string): Promise<CampPrivacyNotice> {
    const response = await api.get(`camps/${campId}/privacy-notice/addendum`);

    return response?.data?.data;
  }

  async function publishCampAddendum(
    campId: string,
    content: PrivacyNoticeAddendum,
  ): Promise<CampPrivacyNotice> {
    const response = await api.put(`camps/${campId}/privacy-notice/addendum`, {
      content,
    });

    return response?.data?.data;
  }

  return {
    fetchOrganizationNotice,
    publishOrganizationNotice,
    fetchCampNotice,
    fetchCampAddendum,
    publishCampAddendum,
  };
}
