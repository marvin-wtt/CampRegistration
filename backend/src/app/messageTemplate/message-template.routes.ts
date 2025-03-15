import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
import express from 'express';
import messageTemplateController from './message-template.controller.js';
import service from './message-template.service.js';
import { catchParamAsync } from '#utils/catchAsync';
import { controller } from '#utils/bindController.js';

const router = express.Router({ mergeParams: true });

router.param(
  'messageTemplateId',
  catchParamAsync(async (req, _res, id) => {
    const camp = req.modelOrFail('camp');
    const template = await service.getMessageTemplateById(camp.id, id);
    req.setModel('messageTemplate', template);
  }),
);

router.get(
  '/',
  auth(),
  guard(campManager),
  controller(messageTemplateController, 'index'),
);
router.get(
  '/:messageTemplateId',
  auth(),
  guard(campManager),
  controller(messageTemplateController, 'show'),
);
router.post(
  '/',
  auth(),
  guard(campManager),
  controller(messageTemplateController, 'store'),
);
router.put(
  '/:messageTemplateId',
  auth(),
  guard(campManager),
  controller(messageTemplateController, 'update'),
);
router.delete(
  '/:messageTemplateId',
  auth(),
  guard(campManager),
  controller(messageTemplateController, 'destroy'),
);

export default router;
