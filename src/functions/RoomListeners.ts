import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import Room from "../models/roomModel";
import RoomUser from "../models/roomUsers";
import { VibeCache } from "../cache/cache";
import { ApiError } from "./apiError";

export const roomListeners = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const roomId = String(req.query.room) || "";
  if (!roomId) throw new Error("Invalid roomId");
  const userId = req.userId;
  const cacheKey = roomId + "listeners";
  if (VibeCache.has(cacheKey)) {
    return res.json(VibeCache.get(cacheKey));
  }

  const room = VibeCache.has(roomId + "roomId")
    ? VibeCache.get(roomId + "roomId")
    : await Room.findOne({ roomId }).select("_id");
  if (!room) throw new ApiError("Invalid roomId", 400);

  const [roomUsers, totalListeners] = await Promise.all([
    RoomUser.find({
      roomId: room._id,
      active: true,
      userId: { $nin: userId },
    })
      .populate({
        path: "userId",
        select: "name username imageUrl -_id",
      })
      .limit(17)
      .select("userId -_id"),
    RoomUser.countDocuments({ roomId: room._id, active: true }),
  ]);

  const payload = {
    totalUsers: totalListeners - 1,
    currentPage: 1,
    roomUsers,
  };

  VibeCache.set(cacheKey, payload);
  return res.json(payload);
};
