import express from "express";
import { auth, guard, validate } from "../../middlewares";
import { isCampManager } from "../../guards";
import { campController } from "../../controllers";
import { campValidation } from "../../validations";
import catchAsync from "../../utils/catchAsync";

const router = express.Router({ mergeParams: true });

router.get(
  "/",
  validate(campValidation.index),
  catchAsync(campController.index)
);
router.get(
  "/:campId",
  validate(campValidation.show),
  catchAsync(campController.show)
);
router.post(
  "/",
  auth(),
  validate(campValidation.store),
  catchAsync(campController.store)
);
router.put(
  "/:campId",
  auth(),
  guard(isCampManager),
  validate(campValidation.update),
  catchAsync(campController.update)
);
router.delete(
  "/:campId",
  auth(),
  guard(isCampManager),
  validate(campValidation.destroy),
  catchAsync(campController.destroy)
);

export default router;
