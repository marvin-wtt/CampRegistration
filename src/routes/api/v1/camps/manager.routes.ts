import {managerService, registrationService} from "../../../../services";
import {routeModel, verifyModelExists} from "../../../../utils/verifyModel";
import { auth, guard, multipart, validate } from "../../../../middlewares";
import { campManager, campPublic } from "../../../../guards";
import { managerValidation } from "../../../../validations";
import { managerController } from "../../../../controllers";
import router from "./registration.routes";

router.param("managerId", async (req, res, next, id) => {
  const camp = routeModel(req.models.camp);
  const manager = await managerService.getManagerById(camp.id, id);
  req.models.manager = verifyModelExists(manager);
  next();
});

router.get(
  "/",
  auth(),
  guard([campManager]),
  validate(managerValidation.index),
  managerController.index
);
router.post(
  "/",
  guard([campPublic]),
  multipart(),
  validate(managerValidation.store),
  managerController.store
);
router.delete(
  "/:managerId",
  auth(),
  guard([campManager]),
  validate(managerValidation.destroy),
  managerController.destroy
);
