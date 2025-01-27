import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import User from "../models/userModel";
import {
  decryptObjectValues,
  GET_ROOM_LISTENERS_CACHE_KEY,
} from "../lib/utils";
import { ApiError } from "./apiError";
import { VibeCacheDb } from "../cache/cache-db";

export const updateUserDp = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const userId = req.userId;
  const roomId = req.cookies.room || req.headers.room;
  const socketId = req.headers.socket;
  if (!userId) throw new ApiError("Login required", 401);
  if (!roomId) throw new ApiError("RoomId is missing", 400);

  const data = decryptObjectValues(req.body) as {
    imageUrl: string;
    imageDelUrl: string;
  };
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
  VibeCacheDb[GET_ROOM_LISTENERS_CACHE_KEY(roomId)].update(
    {
      userId: {
        id: socketId,
      },
    },
    {
      userId: {
        imageUrl: data.imageUrl,
      },
    }
  );
  return res.status(204).send();
};
