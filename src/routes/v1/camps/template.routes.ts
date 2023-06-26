import { templateController } from "../../../controllers";
import { auth, guard, validate } from "../../../middlewares";
import { campManager } from "../../../guards";
import express from "express";
import { templateValidation } from "../../../validations";
import { templateService } from "../../../services";
import {routeModel, verifyModelExists} from "../../../utils/verifyModel";

const router = express.Router({ mergeParams: true });

router.param("templateId", async (req, res, next, id) => {
  const camp = routeModel(req.models.camp);
  const template = await templateService.getTemplateById(camp.id, id);
  req.models.template = verifyModelExists(template);
  next();
});

router.get(
  "/",
  auth(),
  guard([campManager]),
  validate(templateValidation.index),
  templateController.index
);
router.get(
  "/:templateId",
  auth(),
  guard([campManager]),
  validate(templateValidation.show),
  templateController.show
);
router.post("/", auth(), guard([campManager]), templateController.store);
router.put(
  "/:templateId",
  auth(),
  guard([campManager]),
  validate(templateValidation.update),
  templateController.update
);
router.delete(
  "/:templateId",
  auth(),
  guard([campManager]),
  validate(templateValidation.destroy),
  templateController.destroy
);

export default router;
