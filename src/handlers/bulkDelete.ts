//used in news src
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { CustomSocket, searchResults } from "../../types";
import { broadcast } from "../lib/customEmit";
import { decrypt } from "../lib/lock";
import Queue from "../models/queueModel";
import Vote from "../models/voteModel";
import { errorHandler } from "./error";
import { Server } from "socket.io";
import {
  DELETE_USER_CACHED_QUEUE_LIST_FOR_ROOM_ID,
  GET_UP_NEXT_SONG_CACHE_KEY,
} from "../lib/utils";
import { VibeCacheDb } from "../cache/cache-db";

export async function bulkDelete(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: CustomSocket,
  data: any
) {
  try {
    const { roomInfo, userInfo } = socket;
    if (!roomInfo || !data || data.length === 0) return;
    if (userInfo?.role !== "admin") throw new Error("only admins can delete");

    const value = decrypt(data) as searchResults[];
    const songIds = value.map((song) => song.id);
    const queueIds = value.map((song) => song.queueId);

    await Promise.all([
      await Queue.deleteMany({
        roomId: roomInfo._id,
        "songData.id": { $in: songIds },
      }),
      await Vote.deleteMany({
        roomId: roomInfo._id,
        queueId: { $in: queueIds },
      }),
    ]);
    VibeCacheDb[GET_UP_NEXT_SONG_CACHE_KEY(roomInfo.roomId)].delete();

    DELETE_USER_CACHED_QUEUE_LIST_FOR_ROOM_ID(roomInfo.roomId);
    broadcast(io, roomInfo.roomId, "update", "update");
  } catch (error: any) {
    console.log("BULK DELETE ERROR", error);
    errorHandler(socket, error.message);
  }
}
