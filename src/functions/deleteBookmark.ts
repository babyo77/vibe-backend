import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import { ApiError } from "./apiError";
import { BookmarkType } from "../models/bookmarkModel";
import { roomCache, tnzara } from "../cache/cache";
import RoomUser from "../models/roomUsers";
import { GET_ROOM_FROM_CACHE } from "../lib/utils";

export const deleteBookmark = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const { type, roomId } = req.query;
  const userId = req.userId;
  if (!userId) throw new ApiError("Login required", 401);
  if (!roomId || typeof roomId !== "string")
    throw new ApiError("RoomId is missing", 400);
  if (!type || typeof type !== "string")
    throw new ApiError("Type is missing", 400);
  if (!Object.values(BookmarkType).includes(type as BookmarkType))
    throw new ApiError("Invalid bookmark type", 400);
  const savedKey = userId + "room" + "saved";
  if (type == "room") {
    await RoomUser.findOneAndUpdate(
      { userId: userId, roomId: await GET_ROOM_FROM_CACHE(roomId) },
      {
        saved: false,
      }
    );
    const bookmarkedCacheKey = userId + "isBookmarked";
    roomCache.del(savedKey);
    tnzara.set(bookmarkedCacheKey, false);
  }
  return res.status(204).send();
};
