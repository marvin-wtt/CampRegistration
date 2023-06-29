import { catchRequestAsync } from "../utils/catchAsync";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";
import { collection, resource } from "../resources/resource";
import {
  emailService,
  managerService,
  templateService,
  userService,
} from "../services";
import { templateResource } from "../resources";

const index = catchRequestAsync(async (req, res) => {
  const { campId } = req.params;
  // TODO
  res.send(httpStatus.NOT_IMPLEMENTED);
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

  res.status(201).send();

  // TODO Generate invitation token
  //  send email

  res.send(httpStatus.NOT_IMPLEMENTED);
});

const acceptInvite = catchRequestAsync(async (req, res) => {
  const { campId, managerId } = req.params;
  // TODO
  res.send(httpStatus.NOT_IMPLEMENTED);
});

const destroy = catchRequestAsync(async (req, res) => {
  const { campId, managerId } = req.params;
  // TODO
  res.send(httpStatus.NOT_IMPLEMENTED);
});

export default {
  index,
  store,
  destroy,
};
