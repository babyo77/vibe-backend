import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import RoomUser from "../models/roomUsers";
import User from "../models/userModel";
import Room from "../models/roomModel";
import { ApiError } from "./apiError";
import { Bookmark } from "../models/bookmarkModel";
import { tnzara, VibeCache } from "../cache/cache";

export async function checkVibe(
  req: CustomRequest,
  res: Response
): Promise<Response> {
  const userId = req.userId;
  const session = req.cookies.vibeIdR || req.headers.authorization; // Get cookies from the request
  const roomId = req.cookies?.room; // Get room ID from cookies
  const bookmarkedCacheKey = userId + "isBookmarked";
  const userInfoCacheKey = userId + "userInfo";
  const roomCacheKey = roomId + "roomId";
  if (!userId) throw new ApiError("Unauthorized", 401);
  const [user, room] = await Promise.all([
    tnzara.has(userInfoCacheKey)
      ? (tnzara.get(userInfoCacheKey) as any)
      : User.findById(userId), // Fetch the user by ID
    VibeCache.has(roomCacheKey)
      ? (VibeCache.get(roomCacheKey) as any)
      : Room.findOne({ roomId }), // Fetch the room by roomId
  ]);

  const roleData = await RoomUser.findOne({
    userId: userId,
    roomId: room?._id,
  }).select("role");

  const isBookmarked = tnzara.has(bookmarkedCacheKey)
    ? tnzara.get(bookmarkedCacheKey)
    : await Bookmark.exists({
        type: "room",
        uri: roomId,
        userId: userId,
      });

  if (!user) throw new ApiError("Unauthorized", 401);
  const userData = {
    ...user.toObject(),
    token: session,
    roomId,
    isBookmarked,
    role: roleData?.role || "guest",
  };
  tnzara.set(bookmarkedCacheKey, isBookmarked);
  tnzara.set(userInfoCacheKey, user);
  return res.json(userData);
}
