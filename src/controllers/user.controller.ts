import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { userService } from "../services";
import exclude from "../utils/exclude";

const index = catchAsync(async (req, res) => {
  const filter = exclude(req.query, ["sortBy", "limit", "page"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const show = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  res.send(user);
});

const store = catchAsync(async (req, res) => {
  const { email, password, name, role } = req.body;
  const user = await userService.createUser({
    name: name,
    email: email,
    password: password,
    role: role,
  });
  res.status(httpStatus.CREATED).send(user);
});

const update = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await userService.updateUserById(userId, req.body);
  res.send(user);
});

const destroy = catchAsync(async (req, res) => {
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
