import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import { catchRequestAsync } from "../utils/catchAsync";
import { userService } from "../services";
import exclude from "../utils/exclude";

const index = catchRequestAsync(async (req, res) => {
  const filter = exclude(req.query, ["sortBy", "limit", "page"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const show = catchRequestAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  res.send(user);
});

const store = catchRequestAsync(async (req, res) => {
  const { email, password, name, role, locale } = req.body;
  const user = await userService.createUser({
    name,
    email,
    password,
    role,
    locale
  });
  res.status(httpStatus.CREATED).send(user);
});

const update = catchRequestAsync(async (req, res) => {
  const { userId } = req.params;
  const { email, password, name, role, locale } = req.body;
  const user = await userService.updateUserById(userId, {
    name,
    email,
    password,
    role,
    locale
  });
  res.send(user);
});

const destroy = catchRequestAsync(async (req, res) => {
  const { userId } = req.params;
  await userService.deleteUserById(userId);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  index,
  show,
  store,
  update,
  destroy,
};
