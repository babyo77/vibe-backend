import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import RoomUser from "../models/roomUsers";
import { VibeCache } from "../cache/cache";
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

  // If browsing, check cache for "browse" data
  if (type === "browse") {
    if (VibeCache.has(baseKey)) {
      return res.json(VibeCache.get(baseKey));
    }

    const roomAdmins = await RoomUser.aggregate(roomPipeline(userId, 1, 4));
    VibeCache.set(baseKey, roomAdmins[0].rooms);

    return res.json(roomAdmins[0].rooms);
  }

  // If fetching "all", check cache for "all" data
  if (type === "all") {
    if (VibeCache.has(dataKey)) {
      return res.json(VibeCache.get(dataKey));
    }
    const allRooms = await RoomUser.aggregate(
      roomPipeline(userId, page, 50, true, search)
    );
    const result = {
      total: allRooms[0].total,
      start: page,
      results: allRooms[0].rooms,
    };

    VibeCache.set(dataKey, result);

    return res.json(result);
  }

  // Handle unsupported types
  throw new ApiError("Invalid type", 400);
}
