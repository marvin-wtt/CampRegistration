import type {
  CampManager,
  NewsletterManager,
  OrganizationMember,
  OrganizationVerificationStatus,
  User,
} from '#generated/prisma/client.js';

export interface ProfileOrganizationMembership extends OrganizationMember {
  organization: {
    id: string;
    verificationStatus: OrganizationVerificationStatus;
    camps: { id: string }[];
    newsletters: { id: string }[];
  };
}

export interface ProfileUser extends Omit<User, 'password'> {
  campRoles: CampManager[];
  newsletterManagers: NewsletterManager[];
  organizationMembers: ProfileOrganizationMembership[];
  twoFactor?: { confirmedAt: Date | null } | null;
}
