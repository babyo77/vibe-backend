import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import { decryptObjectValues } from "../lib/utils";
import User from "../models/userModel";

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
      /^[a-zA-Z0-9_]+$/.test(data.name) && /[^_]+/.test(data.name);
    const isValidUserName =
      /^[a-zA-Z0-9_]+$/.test(data.username) && /[^_]+/.test(data.username);

    if (!isValidName) {
      throw new Error("Special characters not allowed in name");
    }
    if (!isValidUserName) {
      throw new Error("Special characters not allowed in username");
    }
    if (data.username.length <= 3 || data.name.length <= 3) {
      throw new Error("Name or username is too short, minimum 4 characters");
    }
    if (data.username.length > 15 || data.name.length > 15) {
      throw new Error("Name or username  is too large, maximum 15 characters");
    }

    const isAlreadyUsernameExist = await User.exists({
      username: data.username,
    });
    if (isAlreadyUsernameExist) {
      throw new Error("Username already taken");
    }
    await User.findByIdAndUpdate(userId, {
      username: data.username,
      name: data.name,
    });
    res.send();
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, data: {}, message: error?.message });
  }
};
