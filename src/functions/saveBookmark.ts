import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import { ApiError } from "./apiError";
import { Bookmark, BookmarkType } from "../models/bookmarkModel";
import Queue from "../models/queueModel";
import { tnzara, VibeCache } from "../cache/cache";

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
    const [randomSong] = await Queue.aggregate([
      { $match: { roomId: VibeCache.get(roomCacheKey), deleted: false } },
      { $sample: { size: 1 } },
      {
        $project: {
          "songData.image": { $arrayElemAt: ["$songData.image", -1] },
        },
      },
      {
        $project: {
          _id: 0,
          imageUrl: "$songData.image.url",
        },
      },
    ]);

    await Bookmark.findOneAndUpdate(
      {
        userId,
        name: `Room #${roomId}`,
      },
      {
        userId,
        name: `Room #${roomId}`,
        type,
        image:
          randomSong?.imageUrl ||
          "https://i.pinimg.com/736x/70/5a/b0/705ab0bbad4e3f8b070f0f3f38640ccc.jpg",
        uri: roomId,
      }
    );
    const bookmarkedCacheKey = userId + "isBookmarked";
    tnzara.set(bookmarkedCacheKey, true);
  }
  return res.status(204).send();
};
