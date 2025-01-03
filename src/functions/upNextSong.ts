import { Response } from "express";
import { getCurrentlyPlaying, getSongByOrder } from "../lib/utils";
import { CustomRequest } from "../middleware/auth";
import Room from "../models/roomModel";
import { tempCache, VibeCache } from "../cache/cache";
import { searchResults } from "../../types";
import { ApiError } from "./apiError";

export const upNextSong = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const roomId = String(req.query.room) || "";

  if (!roomId) throw new ApiError("Invalid roomId", 400);
  if (tempCache.has(roomId + "upNextSong")) {
    return res.json(tempCache.get(roomId + "upNextSong"));
  }
  const room = VibeCache.has(roomId + "roomId")
    ? VibeCache.get(roomId + "roomId")
    : await Room.findOne({ roomId });
  if (!room) throw new ApiError("Invalid roomId", 400);

  let nextSong = [];
  const value = VibeCache.has(roomId + "isplaying")
    ? (VibeCache.get(roomId + "isplaying") as searchResults)
    : (await getCurrentlyPlaying(room._id))[0];
  nextSong = await getCurrentlyPlaying(room?._id, undefined, false);
  if (nextSong?.length == 0) {
    nextSong = await getSongByOrder(room?._id, value?.order, undefined, value);
  }
  tempCache.set(roomId + "upNextSong", nextSong);
  return res.json(nextSong);
};
