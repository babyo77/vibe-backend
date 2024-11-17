import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import { decryptObjectValues } from "../lib/utils";
import User from "../models/userModel";
import { ApiError } from "./apiError";

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
  const isValidName =
    /^[a-zA-Z0-9_ ]+$/.test(data.name) && /[^_ ]+/.test(data.name);
  const isValidUserName =
    /^[a-z0-9_]+$/.test(data.username) &&
    /[^_]+/.test(data.username) &&
    data.username === data.username.toLowerCase();
  if (!isValidName) {
    throw new ApiError("Special characters not allowed in name", 400);
  }
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
  if (data.username.length > 15 || data.name.length > 15) {
    throw new ApiError(
      "Name or username  is too large, maximum 15 characters",
      400
    );
  }

  const isAlreadyUsernameExist = await User.findOne({
    username: data.username,
  });
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
  return res.status(204).send();
};
