import express, { type Request } from 'express';
import { auth, guard } from '#middlewares/index';
import { or, campActive, campManager } from '#guards/index';
import { catchParamAsync } from '#utils/catchAsync';
import campController from './camp.controller.js';
import campService from './camp.service.js';
import managerRoutes from '#app/manager/manager.routes';
import managerService from '#app/manager/manager.service';
import registrationRoutes from '#app/registration/registration.routes';
import tableTemplateRoutes from '#app/tableTemplate/table-template.routes';
import roomRoutes from '#app/room/room.routes';
import campFileRoutes from './camp-files.routes.js';
import expenseRoutes from '#app/expense/expense.routes';
import messageRoutes from '#app/message/message.routes';
import messageTemplateRoutes from '#app/messageTemplate/message-template.routes';
import type {
  CampCreateData,
  CampQuery,
} from '@camp-registration/common/entities';
import { controller } from '#utils/bindController';

const router = express.Router();

router.param(
  'campId',
  catchParamAsync(async (req, _res, id) => {
    const camp = await campService.getCampById(id);
    req.setModelOrFail('camp', camp);
  }),
);

const queryShowAllGuard = (req: Request) => {
  const query = req.query as CampQuery;

  // Admins will bypass this guard
  return query.showAll === undefined;
};

const referenceCampGuard = (req: Request) => {
  const userId = req.authUserId();
  const { referenceCampId } = req.body as CampCreateData;

  if (!referenceCampId) {
    return true;
  }

  return managerService.campManagerExistsWithUserIdAndCampId(
    referenceCampId,
    userId,
  );
};

router.use('/:campId/registrations', registrationRoutes);
router.use('/:campId/table-templates', tableTemplateRoutes);
router.use('/:campId/messages', messageRoutes);
router.use('/:campId/message-templates', messageTemplateRoutes);
router.use('/:campId/managers', managerRoutes);
router.use('/:campId/rooms', roomRoutes);
router.use('/:campId/files', campFileRoutes);
router.use('/:campId/expenses', expenseRoutes);

router.get('/', guard(queryShowAllGuard), controller(campController, 'index'));
router.get(
  '/:campId',
  guard(or(campManager, campActive)),
  controller(campController, 'show'),
);
router.post(
  '/',
  auth(),
  guard(referenceCampGuard),
  controller(campController, 'store'),
);
router.patch(
  '/:campId',
  auth(),
  guard(campManager),
  controller(campController, 'update'),
);
router.delete(
  '/:campId',
  auth(),
  guard(campManager),
  controller(campController, 'destroy'),
);

export default router;
