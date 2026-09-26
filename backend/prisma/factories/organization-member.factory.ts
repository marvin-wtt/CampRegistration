import { Prisma } from '#generated/prisma/client.js';
import prisma from '../client.js';
import { OrganizationFactory } from './organization.factory';

export const OrganizationMemberFactory = {
  build: (
    data: Partial<Prisma.OrganizationMemberCreateInput> = {},
  ): Prisma.OrganizationMemberCreateInput => {
    return {
      role: 'MEMBER',
      organization: data.organization ?? {
        create: OrganizationFactory.build(),
      },
      ...data,
    };
  },

  create: async (data: Partial<Prisma.OrganizationMemberCreateInput> = {}) => {
    return prisma.organizationMember.create({
      data: OrganizationMemberFactory.build(data),
    });
  },
};
