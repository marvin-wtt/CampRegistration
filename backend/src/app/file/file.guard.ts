import type { Request } from 'express';
import type { GuardFn } from '#core/guard';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';

type File = Exclude<Request['models']['file'], undefined>;

type MaybePromise<T> = T | Promise<T>;

export type FileGuardResolver = (req: Request) => MaybePromise<GuardFn>;

export type FileAccessType = 'view' | 'edit' | 'delete';

export type FileGuardResolvers = Partial<
  Record<FileAccessType, FileGuardResolver>
>;

interface FileGuardRegistration {
  modelName: string;
  resolvers: FileGuardResolvers;
}

const fileGuardRegistry = new Map<string, FileGuardResolvers>();

function resolveFileGuardRegistration(
  file: File,
): FileGuardRegistration | null {
  const registrations = Array.from(
    fileGuardRegistry,
    ([modelName, resolvers]) => ({
      modelName,
      resolvers,
    }),
  ).filter(({ modelName }) => {
    const foreignKey = `${modelName}Id` as keyof typeof file;

    return file[foreignKey] != null;
  });

  if (registrations.length > 1) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `File "${file.id}" is linked to multiple registered models.`,
    );
  }

  return registrations[0] ?? null;
}

export function registerFileGuard(
  modelName: string,
  resolvers: FileGuardResolvers,
): void {
  if (fileGuardRegistry.has(modelName)) {
    throw new Error(
      `File guard resolver for model "${modelName}" is already registered.`,
    );
  }

  fileGuardRegistry.set(modelName, resolvers);
}

export function unregisterAllFileGuards(): void {
  fileGuardRegistry.clear();
}

const allowGuard: GuardFn = () => true;

async function resolveFileAccessGuard(
  req: Request,
  accessType: FileAccessType,
): Promise<GuardFn> {
  const file = req.modelOrFail('file');

  const guardRegistration = resolveFileGuardRegistration(file);

  if (guardRegistration === null) {
    // Temporary files may only be accessed by the session that created them.
    if (file.field !== null && file.field === req.sessionId) {
      return allowGuard;
    }

    throw new ApiError(
      httpStatus.LOCKED,
      `File "${file.id}" is not linked to a registered model.`,
    );
  }

  const resolver = guardRegistration.resolvers[accessType];
  if (resolver === undefined) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      `Access type "${accessType}" is not allowed for files linked to model "${guardRegistration.modelName}".`,
    );
  }

  return resolver(req);
}

export function fileAccessGuard(accessType: FileAccessType): GuardFn {
  return async (req) => {
    const guard = await resolveFileAccessGuard(req, accessType);

    return guard(req);
  };
}

export default fileAccessGuard;
