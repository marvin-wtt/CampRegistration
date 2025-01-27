import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
import express from 'express';
import controller from './message-template.controller.js';
import service from './message-template.service.js';
import { catchParamAsync } from '#utils/catchAsync';

const router = express.Router({ mergeParams: true });

router.param(
  'messageTemplateId',
  catchParamAsync(async (req, _res, name) => {
    const camp = req.modelOrFail('camp');
    const template = await service.getMessageTemplateById(camp.id, name);
    req.setModel('messageTemplate', template);
  }),
);

router.get('/', auth(), guard(campManager), controller.index);
router.get('/:messageTemplateId', auth(), guard(campManager), controller.show);
router.post('/', auth(), guard(campManager), controller.store);
router.put(
  '/:messageTemplateId',
  auth(),
  guard(campManager),
  controller.update,
);
router.delete(
  '/:messageTemplateId',
  auth(),
  guard(campManager),
  controller.destroy,
);

export default router;
