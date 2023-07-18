import express from "express";
import { auth, guard, validate } from "../../../../../middlewares";
import { campManager } from "../../../../../guards";
import {
  routeModel,
  verifyModelExists,
} from "../../../../../utils/verifyModel";
import { catchParamAsync } from "../../../../../utils/catchAsync";
import { bedValidation } from "../../../../../validations";
import { bedService } from "../../../../../services";
import { bedController } from "../../../../../controllers";

const router = express.Router({ mergeParams: true });

router.param(
  "bedId",
  catchParamAsync(async (req, res, next, id) => {
    const camp = routeModel(req.models.camp);
    const room = routeModel(req.models.room);
    const bed = await bedService.getBedById(camp.id, room.id, id);
    req.models.bed = verifyModelExists(bed);
    next();
  })
);

router.put(
  "/:bedId",
  auth(),
  guard([campManager]),
  validate(bedValidation.update),
  bedController.update
);

export default router;
