import express from "express";
import { auth, guard, validate } from "middlewares";
import { campManager } from "guards";
import { routeModel, verifyModelExists } from "utils/verifyModel";
import { catchParamAsync } from "utils/catchAsync";
import { roomValidation } from "validations";
import { roomService } from "services";
import { roomController } from "controllers";
import bedRoutes from "./bed.routes";

const router = express.Router({ mergeParams: true });

router.param(
  "roomId",
  catchParamAsync(async (req, res, next, id) => {
    const camp = routeModel(req.models.camp);
    const room = await roomService.getRoomById(camp.id, id);
    req.models.room = verifyModelExists(room);
    next();
  }),
);

router.use("/:roomId/beds", bedRoutes);

router.get(
  "/",
  auth(),
  guard([campManager]),
  validate(roomValidation.index),
  roomController.index,
);
router.get(
  "/:roomId",
  auth(),
  guard([campManager]),
  validate(roomValidation.show),
  roomController.show,
);
router.post("/", auth(), guard([campManager]), roomController.store);
router.put(
  "/:roomId",
  auth(),
  guard([campManager]),
  validate(roomValidation.update),
  roomController.update,
);
router.delete(
  "/:roomId",
  auth(),
  guard([campManager]),
  validate(roomValidation.destroy),
  roomController.destroy,
);

export default router;
