import { auth, guard } from '#middlewares/index';
import { campManager } from '#guards/index';
import express from 'express';
import templateController from './table-template.controller.js';
import tableTemplateService from './table-template.service.js';
import { catchParamAsync } from '#utils/catchAsync';

const router = express.Router({ mergeParams: true });

router.param(
  'templateId',
  catchParamAsync(async (req, _res, id) => {
    const camp = req.modelOrFail('camp');
    const template = await tableTemplateService.getTemplateById(camp.id, id);
    req.setModelOrFail('tableTemplate', template);
  }),
);

router.get('/', auth(), guard(campManager), templateController.index);
router.get('/:templateId', auth(), guard(campManager), templateController.show);
router.post('/', auth(), guard(campManager), templateController.store);
router.put(
  '/:templateId',
  auth(),
  guard(campManager),
  templateController.update,
);
router.delete(
  '/:templateId',
  auth(),
  guard(campManager),
  templateController.destroy,
);

export default router;
