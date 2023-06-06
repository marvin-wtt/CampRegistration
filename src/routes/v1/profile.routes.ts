import express from "express";
import { auth, validate } from "../../middlewares";
import { profileValidation } from "../../validations";
import catchAsync from "../../utils/catchAsync";
import { profileController } from "../../controllers";

const router = express.Router({ mergeParams: true });

router.get("/", auth(), catchAsync(profileController.show));
router.put(
  "/",
  auth(),
  validate(profileValidation.update),
  catchAsync(profileController.update)
);

export default router;
