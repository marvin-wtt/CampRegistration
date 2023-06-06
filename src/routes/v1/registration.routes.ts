import { registrationController } from "../../controllers";
import {auth, guard, validate} from "../../middlewares";
import { isCampManager } from "../../guards";
import express from "express";
import catchAsync from "../../utils/catchAsync";
import {registrationValidation} from "../../validations";

const router = express.Router({ mergeParams: true });

router.get(
  "/",
  auth(),
  guard(isCampManager),
  validate(registrationValidation.index),
  catchAsync(registrationController.index)
);
router.get(
  "/:registrationId",
  auth(),
  guard(isCampManager),
  validate(registrationValidation.show),
  catchAsync(registrationController.show)
);
router.post("/", catchAsync(registrationController.store));
router.put(
  "/:registrationId",
  auth(),
  guard(isCampManager),
  validate(registrationValidation.update),
  catchAsync(registrationController.update)
);
router.delete(
  "/:registrationId",
  auth(),
  guard(isCampManager),
  validate(registrationValidation.destroy),
  catchAsync(registrationController.destroy)
);

export default router;
