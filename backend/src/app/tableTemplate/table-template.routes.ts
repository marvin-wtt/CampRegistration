import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
import express from 'express';
import templateController from './table-template.controller.js';
import tableTemplateService from './table-template.service.js';
import { catchParamAsync } from '#utils/catchAsync';
import { controller } from '#utils/bindController';

const router = express.Router({ mergeParams: true });

router.param(
  'templateId',
  catchParamAsync(async (req, _res, id) => {
    const camp = req.modelOrFail('camp');
    const template = await tableTemplateService.getTemplateById(camp.id, id);
    req.setModelOrFail('tableTemplate', template);
  }),
);

router.get(
  '/',
  auth(),
  guard(campManager),
  controller(templateController, 'index'),
);
router.get(
  '/:templateId',
  auth(),
  guard(campManager),
  controller(templateController, 'show'),
);
router.post(
  '/',
  auth(),
  guard(campManager),
  controller(templateController, 'store'),
);
router.put(
  '/:templateId',
  auth(),
  guard(campManager),
  controller(templateController, 'update'),
);
router.delete(
  '/:templateId',
  auth(),
  guard(campManager),
  controller(templateController, 'destroy'),
);

export default router;
