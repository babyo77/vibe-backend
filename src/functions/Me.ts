import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import User from "../models/userModel";
import { VibeCache } from "../cache/cache";
import { apiError } from "./apiError";

export const getMe = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (VibeCache.has(userId)) {
      return res.json(VibeCache.get(userId));
    }
    const user = await User.findById(userId);
    VibeCache.set(userId, user);
    return res.json(user);
  } catch (error: any) {
    return apiError(res, error.message);
  }
};
