import { Response } from "express";
import {
  GET_ROOM_FROM_CACHE,
  GET_UP_NEXT_SONG_CACHE_KEY,
  getCurrentlyPlaying,
  getSongByOrder,
} from "../lib/utils";
import { CustomRequest } from "../middleware/auth";
import { searchResults } from "../../types";
import { ApiError } from "./apiError";
import { VibeCacheDb } from "../cache/cache-db";
import redisClient from "../cache/redis";

export const upNextSong = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  const roomId = String(req.query.room) || "";

  if (!roomId) throw new ApiError("Invalid roomId", 400);

  const cacheDbKey = GET_UP_NEXT_SONG_CACHE_KEY(roomId);
  if (VibeCacheDb[cacheDbKey].has()) {
    return res.json(VibeCacheDb[cacheDbKey].get()[0]);
  }

  const room = await GET_ROOM_FROM_CACHE(roomId);
  if (!room) throw new ApiError("Invalid roomId", 400);

  let nextSong = [];
  const currentSong =
    ((await redisClient.get(roomId + "isplaying")) as searchResults) ||
    (await getCurrentlyPlaying(room._id))[0];
  nextSong = await getCurrentlyPlaying(room?._id, undefined, false);
  if (nextSong?.length == 0) {
    // const songs = VibeCacheDb[roomId + "queue" + "songs"].get()[0];
    // const randomIndex = Math.floor(Math.random() * songs?.length);
    // const selectedSong = randomIndex ? songs[randomIndex] : currentSong;

    nextSong = await getSongByOrder(
      room?._id,
      currentSong?.order,
      undefined,
      currentSong
    );
  }
  VibeCacheDb[cacheDbKey].add(nextSong);
  return res.json(nextSong);
};
