import { catchRequestAsync } from "@/utils/catchAsync";
import { userService } from "@/services";
import ApiError from "@/utils/ApiError";
import httpStatus from "http-status";
import authUserId from "@/utils/authUserId";
import { resource } from "@/resources/resource";
import { userCampResource } from "@/resources";

const show = catchRequestAsync(async (req, res) => {
  const userId = authUserId(req);
  const user = await userService.getUserByIdWithCamps(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  const camps = user.camps.map((value) => {
    return value.camp;
  });

  res.json(resource(userCampResource(user, camps)));
});

const update = catchRequestAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await userService.updateUserByIdWithCamps(userId, req.body);
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }

  const camps = user.camps.map((value) => {
    return value.camp;
  });

  res.json(resource(userCampResource(user, camps)));
});

export default {
  show,
  update,
};