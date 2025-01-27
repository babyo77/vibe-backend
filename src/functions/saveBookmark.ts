import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import { ApiError } from "./apiError";
import { BookmarkType } from "../models/bookmarkModel";
import { VibeCache } from "../cache/cache";
import RoomUser from "../models/roomUsers";

export const saveBookmark = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const { type } = req.body;
  const userId = req.userId;
  const roomId = req.cookies.room || req.headers.room;
  if (!userId) throw new ApiError("Login required", 401);
  if (!roomId) throw new ApiError("RoomId is missing", 400);
  if (!type) throw new ApiError("Type is missing", 400);
  if (!Object.values(BookmarkType).includes(type))
    throw new ApiError("Invalid bookmark type", 400);
  const roomCacheKey = roomId + "roomId";

  if (type == "room") {
    await RoomUser.findOneAndUpdate(
      { userId: userId, roomId: VibeCache.get(roomCacheKey) },
      {
        saved: true,
      }
    );
  }
  return res.status(204).send();
};
