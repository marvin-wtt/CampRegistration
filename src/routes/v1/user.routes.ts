import express from "express";
import catchAsync from "../../utils/catchAsync";
import { auth, guard, validate } from "../../middlewares";
import userController from "../../controllers/user.controller";
import { userValidation } from "../../validations";

const router = express.Router();

router.get("/", auth(), guard(), catchAsync(userController.index));
router.get("/:userId", auth(), guard(), catchAsync(userController.show));
router.post(
  "/",
  auth(),
  guard(),
  validate(userValidation.store),
  catchAsync(userController.store)
);
router.put(
  "/:userId",
  auth(),
  guard(),
  validate(userValidation.update),
  catchAsync(userController.update)
);
router.delete(
  "/:userId",
  auth(),
  guard(),
  validate(userValidation.destroy),
  catchAsync(userController.destroy)
);

export default router;
