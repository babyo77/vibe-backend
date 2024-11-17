import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import { decryptObjectValues } from "../lib/utils";
import User from "../models/userModel";
import { apiError } from "./apiError";

export const updateUser = async (req: CustomRequest, res: Response) => {
  try {
    const data = decryptObjectValues(req.body) as {
      name: string;
      username: string;
    };
    const userId = req.userId;
    if (!userId) throw new Error("Login required");
    if (!data.username || !data.name)
      throw new Error(`username or name is required`);
    const isValidName =
      /^[a-zA-Z0-9_ ]+$/.test(data.name) && /[^_ ]+/.test(data.name);
    const isValidUserName =
      /^[a-z0-9_]+$/.test(data.username) &&
      /[^_]+/.test(data.username) &&
      data.username === data.username.toLowerCase();
    if (!isValidName) {
      throw new Error("Special characters not allowed in name");
    }
    if (!isValidUserName) {
      throw new Error(
        "Special characters not allowed in username and must be in lowercase"
      );
    }
    if (data.username.length <= 3 || data.name.length <= 3) {
      throw new Error("Name or username is too short, minimum 4 characters");
    }
    if (data.username.length > 15 || data.name.length > 15) {
      throw new Error("Name or username  is too large, maximum 15 characters");
    }

    const isAlreadyUsernameExist = await User.findOne({
      username: data.username,
    });
    if (
      isAlreadyUsernameExist &&
      isAlreadyUsernameExist?._id.toString() !== userId
    ) {
      throw new Error("Username already taken");
    }
    await User.findByIdAndUpdate(userId, {
      username: data.username.toLocaleLowerCase(),
      name: data.name,
    });
    res.send().status(204);
  } catch (error: any) {
    console.log("UPDATE USER ERROR", error);
    return apiError(res, error.message, 401);
  }
};
