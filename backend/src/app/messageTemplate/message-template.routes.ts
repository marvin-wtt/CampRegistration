import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
import express from 'express';
import controller from './message-template.controller.js';
import service from './message-template.service.js';
import { routeModel, verifyModelExists } from '#utils/verifyModel';
import { catchParamAsync } from '#utils/catchAsync';

const router = express.Router({ mergeParams: true });

router.param(
  'messageTemplateName',
  catchParamAsync(async (req, _res, name) => {
    const camp = routeModel(req.models.camp);
    const template = await service.getMessageTemplateByName(camp.id, name);
    req.models.messageTemplate = verifyModelExists(template);
  }),
);

router.get('/', auth(), guard(campManager), controller.index);
router.get(
  '/:messageTemplateName',
  auth(),
  guard(campManager),
  controller.show,
);
router.post('/', auth(), guard(campManager), controller.store);
router.put(
  '/:messageTemplateName',
  auth(),
  guard(campManager),
  controller.update,
);
router.delete(
  '/:messageTemplateName',
  auth(),
  guard(campManager),
  controller.destroy,
);

export default router;
