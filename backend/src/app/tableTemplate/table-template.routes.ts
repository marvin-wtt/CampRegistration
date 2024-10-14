import { auth, guard, validate } from 'middlewares';
import { campManager } from 'guards';
import express from 'express';
import templateController from './table-template.controller';
import templateValidation from './table-template.validation';
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

router.get(
  '/',
  auth(),
  guard(campManager),
  validate(templateValidation.index),
  templateController.index,
);
router.get(
  '/:templateId',
  auth(),
  guard(campManager),
  validate(templateValidation.show),
  templateController.show,
);
router.post('/', auth(), guard(campManager), templateController.store);
router.put(
  '/:templateId',
  auth(),
  guard(campManager),
  validate(templateValidation.update),
  templateController.update,
);
router.delete(
  '/:templateId',
  auth(),
  guard(campManager),
  validate(templateValidation.destroy),
  templateController.destroy,
);

export default router;
