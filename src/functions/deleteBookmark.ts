import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import { ApiError } from "./apiError";
import { Bookmark, BookmarkType } from "../models/bookmarkModel";
import { tnzara } from "../cache/cache";

export const deleteBookmark = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const { type } = req.query;
  const userId = req.userId;
  if (!userId) throw new ApiError("Login required", 401);
  if (!type || typeof type !== "string")
    throw new ApiError("Type is missing", 400);
  if (!Object.values(BookmarkType).includes(type as BookmarkType))
    throw new ApiError("Invalid bookmark type", 400);

  if (type == "room") {
    await Bookmark.deleteOne({
      userId,
      name: `Room #${req.cookies.room}`,
      type,
    });
    const bookmarkedCacheKey = userId + "isBookmarked";
    tnzara.set(bookmarkedCacheKey, false);
  }
  return res.status(204).send();
};
