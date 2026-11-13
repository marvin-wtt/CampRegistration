import type { ExpenseCategory, Prisma } from '#generated/prisma/client';
import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import { AuditService } from '#app/audit/audit.service';
import { expenseCategoryAuditPolicy } from '#app/expenseCategory/expense-category.audit';
import { defaultExpenseCategoriesForCountries } from '#app/expenseCategory/expense-category.defaults';
import ApiError from '#core/router/ApiError';
import httpStatus from 'http-status';
import { ulid } from '#utils/ulid';

type Translatable = string | Record<string, string>;

export type ExpenseCategoryWithCount = ExpenseCategory & {
  _count: { expenses: number };
};

const withCount = { _count: { select: { expenses: true } } } as const;

/** What a new event's category rows are built from; ids are fresh. */
export type ExpenseCategoryCreateManyData = Omit<
  Prisma.ExpenseCategoryCreateManyEventInput,
  'createdAt' | 'updatedAt'
>[];

@injectable()
export class ExpenseCategoryService extends BaseService {
  constructor(@inject(AuditService) private readonly audit: AuditService) {
    super();
  }

  async getCategoryById(eventId: string, id: string) {
    return this.prisma.expenseCategory.findFirst({
      where: { id, eventId },
      include: withCount,
    });
  }

  async queryCategories(eventId: string) {
    return this.prisma.expenseCategory.findMany({
      where: { eventId },
      include: withCount,
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });
  }

  async createCategory(
    eventId: string,
    data: { parentId?: string | null; name: Translatable; position?: number },
  ) {
    return this.transaction(async (tx) => {
      const parentId = data.parentId ?? null;
      if (parentId) {
        await this.assertGroupable(eventId, parentId);
      }

      const position =
        data.position ??
        (await tx.expenseCategory.count({ where: { eventId, parentId } }));

      const category = await tx.expenseCategory.create({
        data: { eventId, parentId, name: data.name, position },
        include: withCount,
      });

      await this.audit.created(expenseCategoryAuditPolicy, category);

      return category;
    });
  }

  async updateCategory(
    category: ExpenseCategory,
    data: { name?: Translatable | undefined; archived?: boolean | undefined },
  ) {
    return this.transaction(async (tx) => {
      const archivedAt =
        data.archived === undefined
          ? undefined
          : data.archived
            ? (category.archivedAt ?? new Date())
            : null;

      const after = await tx.expenseCategory.update({
        where: { id: category.id },
        data: { name: data.name, archivedAt },
        include: withCount,
      });

      await this.audit.updated(expenseCategoryAuditPolicy, category, after);

      return after;
    });
  }

  /** Only unused categories go; a used one is archived instead. */
  async deleteCategory(category: ExpenseCategoryWithCount) {
    if (category._count.expenses > 0) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'A category with expenses can only be archived.',
        { code: 'EXPENSE_CATEGORY_IN_USE' },
      );
    }

    const childCount = await this.prisma.expenseCategory.count({
      where: { parentId: category.id },
    });
    if (childCount > 0) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'Move or delete the categories of this group first.',
        { code: 'EXPENSE_CATEGORY_HAS_CHILDREN' },
      );
    }

    await this.transaction(async (tx) => {
      await tx.expenseCategory.delete({ where: { id: category.id } });
      await this.audit.deleted(expenseCategoryAuditPolicy, category);
    });
  }

  /**
   * Applies a reordered tree in one go. The tree keeps one level of grouping:
   * a parent is a top-level category, has no expenses, and a category with
   * children stays at the top.
   */
  async reorderCategories(
    eventId: string,
    items: { id: string; parentId: string | null; position: number }[],
  ) {
    const categories = await this.queryCategories(eventId);
    const byId = new Map(categories.map((category) => [category.id, category]));
    const next = new Map(categories.map((c) => [c.id, c.parentId]));

    for (const item of items) {
      if (!byId.has(item.id)) {
        throw this.invalidTree('Unknown category.');
      }
      next.set(item.id, item.parentId);
    }

    for (const [id, parentId] of next) {
      if (parentId === null) {
        continue;
      }
      const parent = byId.get(parentId);
      if (!parent || parentId === id) {
        throw this.invalidTree('Unknown parent category.');
      }
      if (next.get(parentId) !== null) {
        throw this.invalidTree(
          'Categories can only be grouped one level deep.',
        );
      }
      if (parent._count.expenses > 0) {
        throw this.invalidTree(
          'A category with expenses cannot become a group.',
        );
      }
    }

    return this.transaction(async (tx) => {
      for (const item of items) {
        const before = byId.get(item.id);
        if (
          before?.parentId === item.parentId &&
          before.position === item.position
        ) {
          continue;
        }

        const after = await tx.expenseCategory.update({
          where: { id: item.id },
          data: { parentId: item.parentId, position: item.position },
        });
        if (before?.parentId !== item.parentId) {
          await this.audit.updated(expenseCategoryAuditPolicy, before, after);
        }
      }

      return tx.expenseCategory.findMany({
        where: { eventId },
        include: withCount,
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
      });
    });
  }

  /** A leaf of the event that may receive a new expense. */
  async assertAssignable(
    eventId: string,
    categoryId: string,
    options: { allowArchived?: boolean } = {},
  ) {
    const category = await this.db.expenseCategory.findFirst({
      where: { id: categoryId, eventId },
      include: { _count: { select: { children: true } } },
    });

    if (!category) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unknown expense category.', {
        code: 'EXPENSE_CATEGORY_INVALID',
      });
    }
    if (category._count.children > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Expenses belong to a category, not to its group.',
        { code: 'EXPENSE_CATEGORY_INVALID' },
      );
    }
    if (category.archivedAt && !options.allowArchived) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'This category is archived.', {
        code: 'EXPENSE_CATEGORY_ARCHIVED',
      });
    }
  }

  /** The defaults in the event's languages, for a new event without a reference. */
  defaultCategories(
    countries: readonly string[],
  ): ExpenseCategoryCreateManyData {
    return defaultExpenseCategoriesForCountries(countries).map((category) => ({
      id: ulid(),
      parentId: null,
      name: category.name,
      position: category.position,
    }));
  }

  /**
   * A reference event's categories with fresh ids, groups kept. Archived ones
   * are left behind: they were retired on purpose.
   */
  async cloneCategories(
    referenceEventId: string,
  ): Promise<ExpenseCategoryCreateManyData> {
    const categories = await this.prisma.expenseCategory.findMany({
      where: { eventId: referenceEventId, archivedAt: null },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });
    const ids = new Map(categories.map((c) => [c.id, ulid()]));

    // Parents first, so the self-reference resolves within one createMany.
    return [...categories]
      .sort((a, b) => Number(a.parentId !== null) - Number(b.parentId !== null))
      .filter((c) => c.parentId === null || ids.has(c.parentId))
      .map((category) => ({
        id: ids.get(category.id) ?? ulid(),
        parentId: category.parentId
          ? (ids.get(category.parentId) ?? null)
          : null,
        name: category.name,
        position: category.position,
      }));
  }

  private async assertGroupable(eventId: string, parentId: string) {
    const parent = await this.db.expenseCategory.findFirst({
      where: { id: parentId, eventId },
      include: withCount,
    });

    if (parent?.parentId !== null) {
      throw this.invalidTree('Categories can only be grouped one level deep.');
    }
    if (parent._count.expenses > 0) {
      throw this.invalidTree('A category with expenses cannot become a group.');
    }
  }

  private invalidTree(message: string) {
    return new ApiError(httpStatus.BAD_REQUEST, message, {
      code: 'EXPENSE_CATEGORY_TREE_INVALID',
    });
  }
}
