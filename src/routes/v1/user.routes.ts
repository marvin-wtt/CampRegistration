import express from "express";
import catchAsync from "../../utils/catchAsync";
import {auth, guard, validate} from "../../middlewares";
import userController from "../../controllers/user.controller";
import {userValidation} from "../../validations";

const router = express.Router();

// TODO guard admins
router.get("/", auth(), catchAsync(userController.index));
// TODO guard admin
router.get("/:userId", auth(), catchAsync(userController.show));
// TODO guard admins
router.post(
    "/",
    auth(),
    validate(userValidation.store),
    catchAsync(userController.store)
);
// TODO guard admin
router.put(
    "/:userId",
    auth(),
    validate(userValidation.update),
    catchAsync(userController.update)
);

// TODO admin
router.delete(
    "/:userId",
    auth(),
    validate(userValidation.destroy),
    catchAsync(userController.destroy)
);

export default router;
