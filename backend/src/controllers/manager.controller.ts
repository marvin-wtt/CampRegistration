import { catchRequestAsync, catchSilent } from "@/utils/catchAsync";
import ApiError from "@/utils/ApiError";
import httpStatus from "http-status";
import { collection, resource } from "@/resources/resource";
import { notificationService, managerService, userService } from "@/services";
import { campManagerResource } from "@/resources";

const index = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;

  const managers = await managerService.getManagers(campId);
  const resources = managers.map((manager) => campManagerResource(manager));

  res.status(httpStatus.OK).json(collection(resources));
});

const store = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  const { email } = req.body;

  const existingCampManager = await managerService.getManagerByEmail(
    campId,
    email,
  );
  if (existingCampManager) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User is already a camp manager.",
    );
  }

  const user = await userService.getUserByEmail(email);

  const manager =
    user === null
      ? await managerService.inviteManager(campId, email)
      : await managerService.addManager(campId, user.id);

  await catchSilent(() =>
    notificationService.sendCampManagerInvitation(email, campId, manager.id),
  );

  res.status(httpStatus.CREATED).json(resource(campManagerResource(manager)));
});

const destroy = catchRequestAsync(async (req, res) => {
  const { campId, managerId } = req.params;

  const managers = await managerService.getManagers(campId);
  if (managers.length <= 1) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "The camp must always have at least one camp manager.",
    );
  }

  await managerService.removeManager(managerId);

  res.sendStatus(httpStatus.NO_CONTENT);
});

export default {
  index,
  store,
  destroy,
};
