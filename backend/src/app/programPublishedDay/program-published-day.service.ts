import { injectable } from 'inversify';
import { BaseService } from '#core/base/BaseService';

@injectable()
export class ProgramPublishedDayService extends BaseService {
  async listPublishedDays(eventId: string) {
    return this.prisma.programPublishedDay.findMany({
      where: { eventId },
    });
  }

  async getPublishedDay(eventId: string, date: string) {
    return this.prisma.programPublishedDay.findUnique({
      where: { eventId_date: { eventId, date } },
    });
  }

  async publishDay(eventId: string, date: string, plan: 'a' | 'b' | 'both') {
    return this.prisma.programPublishedDay.upsert({
      where: { eventId_date: { eventId, date } },
      create: { eventId, date, plan },
      update: { plan },
    });
  }

  /**
   * Idempotent: unpublishing an already-unpublished day is a no-op, returning
   * `null` rather than throwing — the caller only needs the deleted row's id
   * (for the realtime emit) when there was one to delete.
   */
  async unpublishDay(eventId: string, date: string): Promise<string | null> {
    const existing = await this.getPublishedDay(eventId, date);
    if (!existing) {
      return null;
    }

    await this.prisma.programPublishedDay.delete({
      where: { id: existing.id },
    });

    return existing.id;
  }
}
