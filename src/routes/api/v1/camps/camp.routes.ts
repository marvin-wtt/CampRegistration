import express, { Request } from "express";
import {auth, guard, multipart, validate} from "@/middlewares";
import { campManager, campPublic } from "@/guards";
import { routeModel, verifyModelExists } from "@/utils/verifyModel";
import { catchParamAsync } from "@/utils/catchAsync";
import { campController, fileController } from "@/controllers";
import { campValidation, fileValidation } from "@/validations";
import { campService, fileService } from "@/services";
import registrationRoutes from "./registration.routes";
import templateRoutes from "./template.routes";
import roomRoutes from "./rooms/room.routes";
import managerRoutes from "./manager.routes";

const router = express.Router({ mergeParams: true });

router.param(
  "campId",
  catchParamAsync(async (req, res, next, id) => {
    const camp = await campService.getCampById(id);
    req.models.camp = verifyModelExists(camp);
    next();
  })
);

router.use("/:campId/registrations", registrationRoutes);
router.use("/:campId/templates", templateRoutes);
router.use("/:campId/managers", managerRoutes);
router.use("/:campId/rooms", roomRoutes);

router.get("/", validate(campValidation.index), campController.index);
router.get(
  "/:campId",
  guard([campManager, campPublic]),
  validate(campValidation.show),
  campController.show
);
router.post("/", auth(), validate(campValidation.store), campController.store);
router.patch(
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

// Files
router.param(
  "fileId",
  catchParamAsync(async (req, res, next, id) => {
    const camp = routeModel(req.models.camp);
    const file = await fileService.getModelFile("camp", camp.id, id);
    req.models.file = verifyModelExists(file);
    next();
  })
);

const fileAccessMiddleware = async (req: Request): Promise<boolean | string> => {
  const file = routeModel(req.models.file);

  // Camp managers always have access to all files
  return file.accessLevel === 'public';
};

router.get(
  "/:campId/files/:fileId",
  guard([campManager, fileAccessMiddleware]),
  validate(fileValidation.show),
  fileController.show
);
router.get(
  "/:campId/files/",
  auth(),
  guard([campManager]),
  validate(fileValidation.index),
  fileController.index
)
router.post(
  "/:campId/files/",
  auth(),
  guard([campManager]),
  multipart('file'),
  validate(fileValidation.store),
  fileController.store
)
router.delete(
  "/:campId/files/:fileId",
  auth(),
  guard([campManager]),
  validate(fileValidation.destroy),
  fileController.destroy
)

export default router;
