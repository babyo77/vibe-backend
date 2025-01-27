import { Response } from "express";
import { getQueuePipeline } from "../lib/utils";
import { CustomRequest } from "../middleware/auth";
import Queue from "../models/queueModel";
import Room from "../models/roomModel";
import { VibeCache } from "../cache/cache";
import { ApiError } from "./apiError";
import { VibeCacheDb } from "../cache/cacheDB";

export const queue = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const userId = req.userId;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 100;
  const name = String(req.query.name) || "";
  const roomId = String(req.query.room) || req.headers.room || "";
  const userQueueCacheKey = `userQueueCacheKey${userId}_${page}_${limit}_${name}`;
  if (VibeCacheDb[userQueueCacheKey].has()) {
    return res.json(VibeCacheDb[userQueueCacheKey].get()[0]);
  }
  if (!roomId) throw new ApiError("Invalid roomId");

  const room = VibeCache.has(roomId + "roomId")
    ? VibeCache.get(roomId + "roomId")
    : await Room.findOne({ roomId }).select("_id");
  if (!room) throw new ApiError("Room not found");

  const [total, results] = await Promise.all([
    Queue.countDocuments({ roomId: room._id }),
    Queue.aggregate(getQueuePipeline(room._id, userId, page, limit, name)),
  ]);

  const payload = {
    total,
    start: page,
    results,
  };

  VibeCacheDb[userQueueCacheKey].add(payload);
  return res.json(payload);
};
