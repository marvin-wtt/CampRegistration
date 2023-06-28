import express from "express";
import { auth, guard, validate } from "../../../../middlewares";
import { campManager, campPublic } from "../../../../guards";
import { campController } from "../../../../controllers";
import { campValidation } from "../../../../validations";
import registrationRoutes from "./registration.routes";
import templateRoutes from "./template.routes";
import { campService } from "../../../../services";
import { verifyModelExists } from "../../../../utils/verifyModel";

const router = express.Router({ mergeParams: true });

router.param("campId", async (req, res, next, id) => {
  const camp = await campService.getCampById(id);
  req.models.camp = verifyModelExists(camp);
  next();
});

router.use("/:campId/registrations", registrationRoutes);
router.use("/:campId/templates", templateRoutes);

router.get("/", validate(campValidation.index), campController.index);
router.get(
  "/:campId",
  guard([campManager, campPublic]),
  validate(campValidation.show),
  campController.show
);
router.post("/", auth(), validate(campValidation.store), campController.store);
router.put(
  "/:campId",
  auth(),
  guard([campManager]),
  validate(campValidation.update),
  campController.update
);
router.delete(
  "/:campId",
  auth(),
  guard([campManager]),
  validate(campValidation.destroy),
  campController.destroy
);

export default router;
