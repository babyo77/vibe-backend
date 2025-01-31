import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import RoomUser from "../models/roomUsers";
import User from "../models/userModel";
import Room from "../models/roomModel";
import { ApiError } from "./apiError";
import { tnzara } from "../cache/cache";
import { GET_ROOM_FROM_CACHE } from "../lib/utils";

export async function checkVibe(
  req: CustomRequest,
  res: Response
): Promise<Response> {
  const userId = req.userId;
  const session = req.cookies.vibeIdR || req.headers.authorization; // Get cookies from the request
  const roomId = req.cookies?.room; // Get room ID from cookies
  const bookmarkedCacheKey = userId + "isBookmarked";
  const userInfoCacheKey = userId + "userInfo";
  if (!userId) throw new ApiError("Unauthorized", 401);
  const [user, room] = await Promise.all([
    tnzara.has(userInfoCacheKey)
      ? (tnzara.get(userInfoCacheKey) as any)
      : User.findById(userId), // Fetch the user by ID
    await GET_ROOM_FROM_CACHE(roomId),
  ]);

  const metaData = await RoomUser.findOne({
    userId,
    roomId: room?._id,
  }).select("role saved");

  const isBookmarked = metaData?.saved;

  if (!user) throw new ApiError("Unauthorized", 401);
  const userData = {
    ...user.toObject(),
    token: session,
    roomId,
    isBookmarked,
    role: metaData?.role || "guest",
  };
  tnzara.set(bookmarkedCacheKey, isBookmarked);
  tnzara.set(userInfoCacheKey, user);
  return res.json(userData);
}
