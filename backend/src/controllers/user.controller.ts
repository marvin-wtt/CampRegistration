import httpStatus from "http-status";
import pick from "utils/pick";
import { catchRequestAsync } from "utils/catchAsync";
import { userService } from "services";
import exclude from "utils/exclude";
import { routeModel } from "utils/verifyModel";
import ApiError from "utils/ApiError";
import { authUserId } from "utils/authUserId";
import { Role } from "@prisma/client";

const index = catchRequestAsync(async (req, res) => {
  const filter = exclude(req.query, ["sortBy", "limit", "page"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await userService.queryUsers(filter, options);
  res.json(result);
});

const show = catchRequestAsync(async (req, res) => {
  const user = routeModel(req.models.user);
  res.json(user);
});

const store = catchRequestAsync(async (req, res) => {
  const { email, password, name, role, locale } = req.body;
  const user = await userService.createUser({
    name,
    email,
    password,
    role,
    locale,
  });
  res.status(httpStatus.CREATED).json(user);
});

const update = catchRequestAsync(async (req, res) => {
  const { userId } = req.params;
  const { email, password, name, role, locale, locked } = req.body;
  const authId = authUserId(req);
  const authUser = await userService.getUserById(authId);

  if (locked !== undefined || role) {
    if (authUser?.role !== Role.ADMIN) {
      throw new ApiError(httpStatus.FORBIDDEN, "Insouciant permission");
    }
  }

  const user = await userService.updateUserById(userId, {
    name,
    email,
    password,
    role,
    locale,
    locked,
  });
  res.json(user);
});

const destroy = catchRequestAsync(async (req, res) => {
  const { userId } = req.params;
  await userService.deleteUserById(userId);
  res.sendStatus(httpStatus.NO_CONTENT);
});

export default {
  index,
  show,
  store,
  update,
  destroy,
};
