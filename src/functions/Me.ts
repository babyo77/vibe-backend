import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import User from "../models/userModel";
import { VibeCache } from "../cache/cache";
import { ApiError } from "./apiError";

export const getMe = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const userId = req.userId;
  if (!userId) throw new ApiError("Unauthorized", 401);
  if (VibeCache.has(userId)) {
    return res.json(VibeCache.get(userId));
  }
  const user = await User.findById(userId);
  VibeCache.set(userId, user);
  return res.json(user);
};
