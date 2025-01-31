import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import User from "../models/userModel";
import { ApiError } from "./apiError";
import redisClient from "../cache/redis";

export const getMe = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const userId = req.userId;
  if (!userId) throw new ApiError("Unauthorized", 401);
  if (await redisClient.has(userId)) {
    return res.json(await redisClient.get(userId));
  }
  const user = await User.findById(userId);
  await redisClient.set(userId, user);
  return res.json(user);
};
