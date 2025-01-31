import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import Room from "../models/roomModel";

import { ApiError } from "./apiError";
import { VibeCacheDb } from "../cache/cache-db";
import {
  GET_ROOM_FROM_CACHE,
  GET_ROOM_LISTENERS_CACHE_KEY,
} from "../lib/utils";

export const roomListeners = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const roomId = String(req.query.room) || "";
  if (!roomId) throw new Error("Invalid roomId");
  const cacheDbKey = GET_ROOM_LISTENERS_CACHE_KEY(roomId);

  const room = await GET_ROOM_FROM_CACHE(roomId);
  if (!room) throw new ApiError("Invalid roomId", 400);

  const roomUsers = VibeCacheDb[cacheDbKey].get();

  const payload = {
    totalUsers: roomUsers?.length || 0,
    currentPage: 1,
    roomUsers,
  };

  return res.json(payload);
};
