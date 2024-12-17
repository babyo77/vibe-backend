import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import Room from "../models/roomModel";
import RoomUser from "../models/roomUsers";
import { tempCache } from "../cache/cache";
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
  if (tempCache.has(cacheKey)) {
    return res.json(tempCache.get(cacheKey));
  }

  const room = tempCache.has(roomId + "roomId")
    ? tempCache.get(roomId + "roomId")
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
      .select("userId -_id"),
  ]);

  const totalListeners = await RoomUser.countDocuments({
    roomId: room._id,
    active: true,
    userId: { $nin: new mongoose.Types.ObjectId(userId) },
  });
  const payload = {
    totalUsers: totalListeners,
    currentPage: 1,
    roomUsers,
  };

  tempCache.set(cacheKey, payload);
  return res.json(payload);
};
