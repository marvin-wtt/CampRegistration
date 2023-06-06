import { templateController } from "../../controllers";
import { auth, guard, validate } from "../../middlewares";
import { isCampManager } from "../../guards";
import express from "express";
import catchAsync from "../../utils/catchAsync";
import { templateValidation } from "../../validations";

const router = express.Router({ mergeParams: true });

router.get(
  "/",
  auth(),
  guard(isCampManager),
  validate(templateValidation.index),
  catchAsync(templateController.index)
);
router.get(
  "/:templateId",
  auth(),
  guard(isCampManager),
  validate(templateValidation.show),
  catchAsync(templateController.show)
);
router.post(
  "/",
  auth(),
  guard(isCampManager),
  catchAsync(templateController.store)
);
router.put(
  "/:templateId",
  auth(),
  guard(isCampManager),
  validate(templateValidation.update),
  catchAsync(templateController.update)
);
router.delete(
  "/:templateId",
  auth(),
  guard(isCampManager),
  validate(templateValidation.destroy),
  catchAsync(templateController.destroy)
);

export default router;
