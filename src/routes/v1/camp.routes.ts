import express from "express";
import { auth, guard, validate } from "../../middlewares";
import { campManager } from "../../guards";
import { campController } from "../../controllers";
import { campValidation } from "../../validations";
import catchAsync from "../../utils/catchAsync";
import { bindRouteModels } from "../../middlewares";

const router = express.Router({ mergeParams: true });

router.get(
  "/",
  validate(campValidation.index),
  catchAsync(campController.index)
);
router.get(
  "/:campId",
  bindRouteModels,
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
  bindRouteModels,
  guard([campManager]),
  validate(campValidation.update),
  catchAsync(campController.update)
);
router.delete(
  "/:campId",
  auth(),
  bindRouteModels,
  // guard([campManager]),
  validate(campValidation.destroy),
  catchAsync(campController.destroy)
);

export default router;
