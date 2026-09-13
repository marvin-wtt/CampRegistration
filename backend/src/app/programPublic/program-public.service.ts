import { injectable, inject } from 'inversify';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import type { ProgramPublicSettings } from '@camp-registration/common/settings';
import { clampDate } from '@camp-registration/common/utils';
import { SettingService } from '#app/setting/setting.service';
import { ProgramItemService } from '#app/programItem/program-item.service';
import { computeDefaultPublicDate } from './program-public.util.js';

type ProgramItems = Awaited<
  ReturnType<ProgramItemService['queryProgramItemsInRange']>
>;

export type ProgramPublicViewData =
  | { enabled: false }
  | {
      enabled: true;
      date: string;
      minDate: string;
      maxDate: string;
      published: false;
    }
  | {
      enabled: true;
      date: string;
      minDate: string;
      maxDate: string;
      published: true;
      plan: 'a' | 'b' | 'both';
      items: ProgramItems;
    };

@injectable()
export class ProgramPublicService {
  constructor(
    @inject(SettingService)
    private readonly settingService: SettingService,
    @inject(ProgramItemService)
    private readonly programItemService: ProgramItemService,
  ) {}

  async getPublicView(
    eventId: string,
    event: { startAt: string; endAt: string; timezone: string },
    requestedDate?: string,
  ): Promise<ProgramPublicViewData> {
    const setting = await this.settingService.getSetting(
      eventId,
      SETTING_KEYS.PROGRAM_PUBLIC,
    );
    const data = setting?.data as ProgramPublicSettings | undefined;

    if (!data?.enabled) {
      return { enabled: false };
    }

    const minDate = event.startAt.slice(0, 10);
    const maxDate = event.endAt.slice(0, 10);
    const date = clampDate(
      requestedDate ?? computeDefaultPublicDate(event),
      minDate,
      maxDate,
    );

    // `Record` indexing is optimistic about key presence — a date absent from
    // the map is a real, expected case here (most days are never published),
    // not something the type system happens to allow.
    const plan = data.publishedDays[date] as 'a' | 'b' | 'both' | undefined;
    if (!plan) {
      return { enabled: true, date, minDate, maxDate, published: false };
    }

    const items = await this.programItemService.queryProgramItemsInRange(
      eventId,
      { from: date, to: date, plan },
    );

    return {
      enabled: true,
      date,
      minDate,
      maxDate,
      published: true,
      plan,
      items,
    };
  }
}
