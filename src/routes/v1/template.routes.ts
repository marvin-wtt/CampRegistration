import { templateController } from "../../controllers";
import { auth, guard, validate } from "../../middlewares";
import { campManager } from "../../guards";
import express from "express";
import catchAsync from "../../utils/catchAsync";
import { templateValidation } from "../../validations";

const router = express.Router({ mergeParams: true });

router.get(
  "/",
  auth(),
  guard([campManager]),
  validate(templateValidation.index),
  catchAsync(templateController.index)
);
router.get(
  "/:templateId",
  auth(),
  guard([campManager]),
  validate(templateValidation.show),
  catchAsync(templateController.show)
);
router.post(
  "/",
  auth(),
  guard([campManager]),
  catchAsync(templateController.store)
);
router.put(
  "/:templateId",
  auth(),
  guard([campManager]),
  validate(templateValidation.update),
  catchAsync(templateController.update)
);
router.delete(
  "/:templateId",
  auth(),
  guard([campManager]),
  validate(templateValidation.destroy),
  catchAsync(templateController.destroy)
);

export default router;
