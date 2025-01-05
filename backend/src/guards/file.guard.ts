import express, { Request } from 'express';
import { and, campActive, campManager, GuardFn, or } from './index.js';
import { routeModel, verifyModelExists } from '#utils/verifyModel';
import fileService from '#app/file/file.service';
import campService from '#app/camp/camp.service';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import registrationService from '#app/registration/registration.service';
import expenseService from '#app/expense/expense.service';

const fileAccessGuardResolver = async (req: Request): Promise<GuardFn> => {
  const file = routeModel(req.models.file);
  const modelName = fileService.fileModelName(file);

  const guardMap: Record<string, (req: Request) => Promise<GuardFn>> = {
    registration: registrationGuard,
    camp: campFileGuard,
    expense: expenseGuard,
  };

  const resolveGuard = guardMap[modelName];
  if (!resolveGuard) {
    return () => false;
  }

  return resolveGuard(req);
};

const campFileGuard = async (req: Request): Promise<GuardFn> => {
  const file = routeModel(req.models.file);

  // Load models for guard
  const camp = await campService.getCampById(file.campId!);
  req.models.camp = verifyModelExists(camp);

  const fileAccess: GuardFn = () => {
    return file.accessLevel === 'public';
  };

  return or(campManager, and(fileAccess, campActive));
};

const registrationGuard = async (req: express.Request): Promise<GuardFn> => {
  const file = routeModel(req.models.file);

  if (!file.registrationId) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Invalid guard handler',
    );
  }

  const registration = verifyModelExists(
    await registrationService.getRegistrationWithCampById(file.registrationId),
  );

  req.models.registration = registration;
  req.models.camp = registration.camp;

  return campManager;
};

const expenseGuard = async (req: express.Request): Promise<GuardFn> => {
  const file = routeModel(req.models.file);

  if (!file.expenseId) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Invalid guard handler',
    );
  }

  const expense = verifyModelExists(
    await expenseService.getExpenseWithCampById(file.expenseId),
  );

  req.models.expense = expense;
  req.models.camp = expense.camp;

  return campManager;
};

const fileAccessGuard: GuardFn = async (req) => {
  const guardFn = await fileAccessGuardResolver(req);

  return guardFn(req);
};

export default fileAccessGuard;
