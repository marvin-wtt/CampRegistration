import { Prisma } from '#generated/prisma/client.js';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import prisma from '../client.js';

export const CampSettingFactory = {
  build: (
    data: Partial<Prisma.CampSettingCreateInput> = {},
  ): Prisma.CampSettingCreateInput => {
    return {
      camp: {},
      key: SETTING_KEYS.ROOM_PLANNER,
      data: {
        skipGenderFilter: false,
        skipRoleFilter: false,
      },
      ...data,
    };
  },

  create: async (data: Partial<Prisma.CampSettingCreateInput> = {}) => {
    return prisma.campSetting.create({
      data: CampSettingFactory.build(data),
    });
  },
};
