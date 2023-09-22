import { fileController, registrationController } from "@/controllers";
import { auth, guard, multipart, validate } from "@/middlewares";
import { campManager, campPublic } from "@/guards";
import express from "express";
import { registrationValidation, fileValidation } from "@/validations";
import { fileService, registrationService } from "@/services";
import { routeModel, verifyModelExists } from "@/utils/verifyModel";
import { catchParamAsync } from "@/utils/catchAsync";

const router = express.Router({ mergeParams: true });

router.param(
  "registrationId",
  catchParamAsync(async (req, res, next, id) => {
    const camp = routeModel(req.models.camp);
    const registration = await registrationService.getRegistrationById(
      camp.id,
      id
    );
    req.models.registration = verifyModelExists(registration);
    next();
  })
);

router.get(
  "/",
  auth(),
  guard([campManager]),
  validate(registrationValidation.index),
  registrationController.index
);
router.get(
  "/:registrationId",
  auth(),
  guard([campManager]),
  validate(registrationValidation.show),
  registrationController.show
);
router.post(
  "/",
  guard([campPublic]),
  multipart,
  validate(registrationValidation.store),
  registrationController.store
);
router.put(
  "/:registrationId",
  auth(),
  guard([campManager]),
  multipart,
  validate(registrationValidation.update),
  registrationController.update
);
router.delete(
  "/:registrationId",
  auth(),
  guard([campManager]),
  validate(registrationValidation.destroy),
  registrationController.destroy
);

// Files
router.param(
  "fileId",
  catchParamAsync(async (req, res, next, id) => {
    const registration = routeModel(req.models.registration);
    const file = await fileService.getModelFile(
      'registration',
      registration.id,
      id,
    );
    req.models.file = verifyModelExists(file);
    next();
  })
);

router.get(
  "/:registrationId/files/:file",
  auth(),
  guard([campManager]),
  validate(fileValidation.show),
  fileController.show
);

export default router;
