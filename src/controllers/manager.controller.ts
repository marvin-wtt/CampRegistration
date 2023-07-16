import { catchRequestAsync } from "../utils/catchAsync";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";
import { collection, resource } from "../resources/resource";
import { emailService, managerService } from "../services";
import { campManagerResource } from "../resources";
import { routeModel } from "../utils/verifyModel";

const index = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;

  const managers = await managerService.getManagers(campId);
  const resources = managers.map((manager) => campManagerResource(manager));

  res.json(collection(resources));
});

const store = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  const { email } = req.body;

  const existingCampManager = await managerService.getManagerByEmail(
    campId,
    email
  );
  if (existingCampManager) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User is already a camp manager."
    );
  }

  const manager = await managerService.inviteManager(campId, email);

  const token = manager.invitation?.token;
  // TODO Send notification

  res.status(201).json(resource(campManagerResource(manager)));
});

const destroy = catchRequestAsync(async (req, res) => {
  const { campId, managerId } = req.params;

  const managers = await managerService.getManagers(campId);
  if (managers.length <= 1) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The camp must always have at least one camp manager.");
  }

  await managerService.removeManager(managerId);

  res.sendStatus(httpStatus.NO_CONTENT);
});

const accept = catchRequestAsync(async (req, res) => {
  const { campId, managerId, token } = req.params;

  const manager = routeModel(req.models.manager);

  res.sendStatus(httpStatus.NOT_IMPLEMENTED);
  // TODO Get typed manager
  // const invitation = manager.invitation as Invitation | null;
  //
  // if (!invitation || invitation.token !== token) {
  //   throw new ApiError(httpStatus.FORBIDDEN, "Invalid invitation token");
  // }
  //
  // const userId: string = req.user?.id;
  //
  // const updatedManager = await managerService.acceptManagerInvitation(managerId, userId);
  //
  // res.json(resource(campManagerResource(updatedManager)));
});

export default {
  index,
  store,
  destroy,
  accept,
};
