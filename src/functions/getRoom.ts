import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import RoomUser from "../models/roomUsers";
import { roomCache, VibeCache } from "../cache/cache";
import { ApiError } from "./apiError";
import { roomPipeline } from "../lib/utils";

export async function getRooms(
  req: CustomRequest,
  res: Response
): Promise<Response> {
  const userId = req.userId;
  if (!userId) throw new ApiError("Unauthorized", 401);

  const type = req.params.type; // "browse" or "all"
  if (!type) throw new ApiError("Bad request", 400);

  const page = Number(req.query.page) || 1;
  const search = String(req.query.name || "").trim();

  // Separate cache keys for "browse" and "all"
  const baseKey = userId + "room";
  const dataKey = `${baseKey}:data:${page}:${search}`;
  const savedKey = userId + "room" + "saved";
  // If browsing, check cache for "browse" data
  if (type === "browse") {
    if (VibeCache.has(baseKey)) {
      return res.json(VibeCache.get(baseKey));
    }

    const roomAdmins = await RoomUser.aggregate(roomPipeline(userId, 1, 11));
    const result = {
      total: 11,
      start: page,
      results: roomAdmins[0].rooms,
    };

    VibeCache.set(baseKey, result);

    return res.json(result);
  }

  // If fetching "all", check cache for "all" data
  if (type === "all") {
    if (roomCache.has(dataKey)) {
      return res.json(roomCache.get(dataKey));
    }
    const allRooms = await RoomUser.aggregate(
      roomPipeline(userId, page, 50, search)
    );
    const result = {
      total: allRooms[0].total,
      start: page,
      results: allRooms[0].rooms,
    };

    roomCache.set(dataKey, result);

    return res.json(result);
  }
  if (type === "saved") {
    if (roomCache.has(savedKey)) {
      return res.json(roomCache.get(savedKey));
    }
    const allRooms = await RoomUser.aggregate(
      roomPipeline(userId, page, 100, undefined, true)
    );
    const result = {
      total: allRooms[0].total,
      start: page,
      results: allRooms[0].rooms,
    };

    roomCache.set(savedKey, result);

    return res.json(result);
  }

  // Handle unsupported types
  throw new ApiError("Invalid type", 400);
}
