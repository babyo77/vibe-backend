import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import { decryptObjectValues } from "../lib/utils";
import User from "../models/userModel";
import { ApiError } from "./apiError";
import { tnzara } from "../cache/cache";

export const updateUser = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const data = decryptObjectValues(req.body) as {
    name: string;
    username: string;
  };
  const userId = req.userId;
  if (!userId) throw new ApiError("Login required");
  if (!data.username || !data.name)
    throw new ApiError(`username or name is required`, 400);

  const isValidUserName =
    /^[a-z0-9_]+$/.test(data.username) &&
    /[^_]+/.test(data.username) &&
    data.username === data.username.toLowerCase();

  if (!isValidUserName) {
    throw new ApiError(
      "Special characters not allowed in username and must be in lowercase",
      400
    );
  }
  if (data.username.length <= 3 || data.name.length <= 3) {
    throw new ApiError(
      "Name or username is too short, minimum 4 characters",
      400
    );
  }
  if (data.name.length > 25) {
    throw new ApiError("Name is too large, maximum 25 characters", 400);
  }
  if (data.username.length > 25) {
    throw new ApiError("Username  is too large, maximum 25 characters", 400);
  }

  const isAlreadyUsernameExist = await User.findOne({
    username: data.username,
  }).select("_id");
  if (
    isAlreadyUsernameExist &&
    isAlreadyUsernameExist?._id.toString() !== userId
  ) {
    throw new ApiError("Username already taken", 409);
  }
  await User.findByIdAndUpdate(userId, {
    username: data.username.toLocaleLowerCase(),
    name: data.name,
  });
  tnzara.del(userId + "userInfo");
  return res.status(204).send();
};
