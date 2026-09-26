import { Prisma } from '#generated/prisma/client.js';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import prisma from '../client.js';

export const EventSettingFactory = {
  build: (
    data: Partial<Prisma.EventSettingCreateInput> = {},
  ): Prisma.EventSettingCreateInput => {
    return {
      event: {},
      key: SETTING_KEYS.ROOM_PLANNER,
      data: {
        skipGenderFilter: false,
        skipRoleFilter: false,
      },
      ...data,
    };
  },

  create: async (data: Partial<Prisma.EventSettingCreateInput> = {}) => {
    return prisma.eventSetting.create({
      data: EventSettingFactory.build(data),
    });
  },
};
