import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import Room from "../models/roomModel";
import RoomUser from "../models/roomUsers";
import { tempCache as VibeCache } from "../cache/cache";
import { ApiError } from "./apiError";
import mongoose from "mongoose";

export const roomListeners = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const roomId = String(req.query.room) || "";
  if (!roomId) throw new Error("Invalid roomId");
  const userId = req.userId;
  const cacheKey = roomId + "listeners";
  // if (VibeCache.has(cacheKey)) {
  //   return res.json(VibeCache.get(cacheKey));
  // }

  const room = VibeCache.has(roomId + "roomId")
    ? VibeCache.get(roomId + "roomId")
    : await Room.findOne({ roomId }).select("_id");
  if (!room) throw new ApiError("Invalid roomId", 400);

  const [roomUsers] = await Promise.all([
    RoomUser.find({
      roomId: room._id,
      active: true,
      userId: { $nin: new mongoose.Types.ObjectId(userId) },
    })
      .populate({
        path: "userId",
        select: "name username imageUrl -_id",
      })
      .limit(17)
      .select("userId -_id")
      .lean(),
  ]);

  const totalListeners = RoomUser.countDocuments({
    roomId: room._id,
    active: true,
    userId: { $nin: new mongoose.Types.ObjectId(userId) },
  });
  const payload = {
    totalUsers: totalListeners,
    currentPage: 1,
    roomUsers,
  };

  VibeCache.set(cacheKey, payload);
  return res.json(payload);
};
