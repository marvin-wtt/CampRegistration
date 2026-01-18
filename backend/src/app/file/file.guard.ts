import type { Request } from 'express';
import { type GuardFn } from '#guards/index';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';

// Type definition for file guard resolver function
export type FileGuardResolver = (req: Request) => Promise<GuardFn>;

// Registry to store guard resolvers for different models
const guardRegistry: Record<string, FileGuardResolver> = {};

// Function to register a guard resolver for a specific model
export function registerFileGuard(
  modelId: string,
  resolver: FileGuardResolver,
): void {
  if (modelId in guardRegistry) {
    throw new Error(
      `Guard resolver for model "${modelId}" is already registered.`,
    );
  }

  guardRegistry[modelId] = resolver;
}

export function unregisterAllFileGuards(): void {
  Object.keys(guardRegistry).forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete guardRegistry[key];
  });
}

const fileAccessGuardResolver = async (req: Request): Promise<GuardFn> => {
  const file = req.modelOrFail('file');

  const guardModels = Object.keys(guardRegistry).filter((modelName) => {
    const key = `${modelName}Id`;

    return key in file && file[key as keyof typeof file];
  });

  if (guardModels.length === 0) {
    // We can assume that is file is a tmp file.

    // Temporary files are only accessible by the session that created them
    if (file.field === req.sessionId) {
      return () => true;
    }

    // It should never be accessed
    throw new ApiError(httpStatus.LOCKED, 'File is not linked to any model.');
  }

  if (guardModels.length > 1) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Multiple models found for file: ${file.id}.`,
    );
  }

  const guardFm = guardRegistry[guardModels[0]];

  return guardFm(req);
};

const fileAccessGuard: GuardFn = async (req) => {
  const guardFn = await fileAccessGuardResolver(req);

  return guardFn(req);
};

export default fileAccessGuard;
