import type {
  EventManager,
  NewsletterManager,
  OrganizationMember,
  OrganizationVerificationStatus,
  User,
} from '#generated/prisma/client.js';

export interface ProfileOrganizationMembership extends OrganizationMember {
  organization: {
    id: string;
    verificationStatus: OrganizationVerificationStatus;
    events: { id: string }[];
    newsletters: { id: string }[];
  };
}

export interface ProfileUser extends Omit<User, 'password'> {
  eventRoles: EventManager[];
  newsletterManagers: NewsletterManager[];
  organizationMembers: ProfileOrganizationMembership[];
  twoFactor?: { confirmedAt: Date | null } | null;
}
