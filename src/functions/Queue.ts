import { Response } from "express";
import {
  GET_ROOM_FROM_CACHE,
  GET_UP_NEXT_SONG_CACHE_KEY,
  getQueuePipeline,
} from "../lib/utils";
import { CustomRequest } from "../middleware/auth";
import Queue from "../models/queueModel";
import { ApiError } from "./apiError";
import { VibeCacheDb } from "../cache/cache-db";

export const queue = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const userId = req.userId;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 100;
  const name = String(req.query.name) || "";
  const roomId = String(req.query.room) || req.headers.room || "";
  const userQueueCacheKey = `userQueueCacheKey${roomId}${userId}_${page}_${limit}_${name}`;
  if (!roomId || typeof roomId !== "string")
    throw new ApiError("Invalid roomId");

  VibeCacheDb[GET_UP_NEXT_SONG_CACHE_KEY(roomId)].delete();

  if (VibeCacheDb[userQueueCacheKey].has()) {
    return res.json(VibeCacheDb[userQueueCacheKey].get()[0]);
  }

  const room = await GET_ROOM_FROM_CACHE(roomId);
  if (!room) throw new ApiError("Room not found");

  const [total, results] = await Promise.all([
    Queue.countDocuments({ roomId: room._id }),
    Queue.aggregate(getQueuePipeline(room._id, userId, page, limit, name)),
  ]);

  const payload = {
    total,
    next: total === results.length,
    start: page,
    results,
  };

  VibeCacheDb[userQueueCacheKey].add(payload);
  return res.json(payload);
};
