import { auth, guard } from 'middlewares';
import { campManager } from 'guards';
import express from 'express';
import templateController from './table-template.controller';
import tableTemplateService from './table-template.service';
import { routeModel, verifyModelExists } from 'utils/verifyModel';
import { catchParamAsync } from 'utils/catchAsync';

const router = express.Router({ mergeParams: true });

router.param(
  'templateId',
  catchParamAsync(async (req, res, id) => {
    const camp = routeModel(req.models.camp);
    const template = await tableTemplateService.getTemplateById(camp.id, id);
    req.models.tableTemplate = verifyModelExists(template);
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
