import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import User from "../models/userModel";
import { decryptObjectValues } from "../lib/utils";
import { ApiError } from "./apiError";

export const updateUserDp = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const userId = req.userId;
  const data = decryptObjectValues(req.body) as {
    imageUrl: string;
    imageDelUrl: string;
  };
  if (!userId) throw new ApiError("Login required", 403);
  if (
    !data.imageUrl ||
    !data.imageDelUrl ||
    typeof data.imageUrl !== "string" ||
    typeof data.imageDelUrl !== "string" ||
    data.imageUrl.trim().length == 0 ||
    data.imageDelUrl.trim().length == 0
  )
    throw new ApiError("Image not provided", 400);
  await User.findByIdAndUpdate(userId, {
    imageUrl: data.imageUrl,
    imageDelUrl: data.imageDelUrl,
  });

  return res.status(204).send();
};
