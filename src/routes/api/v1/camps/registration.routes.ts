import { registrationController } from "../../../../controllers";
import { auth, guard, multipart, validate } from "../../../../middlewares";
import { campManager, campPublic } from "../../../../guards";
import express from "express";
import { registrationValidation } from "../../../../validations";
import { registrationService } from "../../../../services";
import {routeModel, verifyModelExists} from "../../../../utils/verifyModel";

const router = express.Router({ mergeParams: true });

router.param("registrationId", async (req, res, next, id) => {
  const camp = routeModel(req.models.camp);
  const registration = await registrationService.getRegistrationById(camp.id, id);
  req.models.registration = verifyModelExists(registration);
  next();
});

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
  multipart(),
  validate(registrationValidation.store),
  registrationController.store
);
router.put(
  "/:registrationId",
  auth(),
  guard([campManager]),
  multipart(),
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

export default router;
