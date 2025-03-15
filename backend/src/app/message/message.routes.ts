import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
import express from 'express';
import messageController from './message.controller.js';
import service from './message.service.js';
import { catchParamAsync } from '#utils/catchAsync';
import { controller } from '#utils/bindController.js';

const router = express.Router({ mergeParams: true });

router.param(
  'messageId',
  catchParamAsync(async (req, _res, id) => {
    const camp = req.modelOrFail('camp');
    const message = await service.getMessageById(camp.id, id);
    req.setModel('message', message);
  }),
);

router.get(
  '/',
  auth(),
  guard(campManager),
  controller(messageController, 'index'),
);
router.get(
  '/:messageId',
  auth(),
  guard(campManager),
  controller(messageController, 'show'),
);
router.post(
  '/',
  auth(),
  guard(campManager),
  controller(messageController, 'store'),
);
router.post(
  '/:messageId/resend',
  auth(),
  guard(campManager),
  controller(messageController, 'resend'),
);
router.delete(
  '/:messageId',
  auth(),
  guard(campManager),
  controller(messageController, 'destroy'),
);

export default router;
