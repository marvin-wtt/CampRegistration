import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
import express from 'express';
import controller from './message.controller.js';
import service from './message.service.js';
import { catchParamAsync } from '#utils/catchAsync';

const router = express.Router({ mergeParams: true });

router.param(
  'messageId',
  catchParamAsync(async (req, _res, id) => {
    const camp = req.modelOrFail('camp');
    const message = await service.getMessageById(camp.id, id);
    req.setModel('message', message);
  }),
);

router.get('/', auth(), guard(campManager), controller.index);
router.get('/:messageId', auth(), guard(campManager), controller.show);
router.post('/', auth(), guard(campManager), controller.store);
router.post(
  '/:messageId/resend',
  auth(),
  guard(campManager),
  controller.resend,
);
router.delete('/:messageId', auth(), guard(campManager), controller.destroy);

export default router;
