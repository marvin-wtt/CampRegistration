import { injectable, inject } from 'inversify';
import { SETTING_KEYS } from '@camp-registration/common/settings';
import type { ProgramPublicSettings } from '@camp-registration/common/settings';
import {
  clampDate,
  currentDateInTimeZone,
} from '@camp-registration/common/utils';
import { SettingService } from '#app/setting/setting.service';
import { ProgramItemService } from '#app/programItem/program-item.service';
import { ProgramPublishedDayService } from '#app/programPublishedDay/program-published-day.service';
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
    @inject(ProgramPublishedDayService)
    private readonly programPublishedDayService: ProgramPublishedDayService,
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
    // `Partial`, not `ProgramPublicSettings`: rows stored before
    // `allowPastDates` existed have no such field, and the type must admit
    // that rather than asserting a shape the stored JSON doesn't guarantee.
    const data = setting?.data as Partial<ProgramPublicSettings> | undefined;

    if (!data?.enabled) {
      return { enabled: false };
    }

    const eventMinDate = event.startAt.slice(0, 10);
    const maxDate = event.endAt.slice(0, 10);
    const today = currentDateInTimeZone(event.timezone);
    // Rows stored before `allowPastDates` existed have no such field — treat
    // them as the documented default rather than as `false`.
    const allowPastDates = data.allowPastDates ?? true;
    // Clamping the *bound* to `today` (rather than rejecting past requests
    // outright) reuses `clampDate` below for both the default-date and
    // requested-date cases, and reads naturally as "browsing further back
    // isn't offered", not an error. `today` is itself clamped into the
    // event's own range first — an event that has already ended entirely
    // must not push `minDate` past `maxDate` (there'd be nothing left to
    // browse), it should just settle on the event's last day.
    const minDate = allowPastDates
      ? eventMinDate
      : clampDate(today, eventMinDate, maxDate);

    const date = clampDate(
      requestedDate ?? computeDefaultPublicDate(event),
      minDate,
      maxDate,
    );

    const publishedDay = await this.programPublishedDayService.getPublishedDay(
      eventId,
      date,
    );

    if (!publishedDay) {
      return {
        enabled: true,
        date,
        minDate,
        maxDate,
        published: false,
      };
    }

    const plan = publishedDay.plan as 'a' | 'b' | 'both';
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
