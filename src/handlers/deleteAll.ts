import { Server } from "socket.io";
import { CustomSocket } from "../../types";
import { broadcast } from "../lib/customEmit";
import Queue from "../models/queueModel";
import Vote from "../models/voteModel";
import { errorHandler } from "./error";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import mongoose from "mongoose";
import { VibeCacheDb } from "../cache/cache-db";
import {
  DELETE_USER_CACHED_QUEUE_LIST_FOR_ROOM_ID,
  GET_UP_NEXT_SONG_CACHE_KEY,
} from "../lib/utils";

export async function deleteAll(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: CustomSocket
) {
  try {
    const { roomInfo, userInfo } = socket;
    if (!roomInfo) return;
    if (userInfo?.role !== "admin")
      throw new Error("only admins can delete all songs");
    await Promise.all([
      await Queue.updateMany(
        {
          roomId: roomInfo._id,
        },
        {
          $set: {
            roomId: new mongoose.Types.ObjectId(),
            deleted: true,
          },
        }
      ),
      await Vote.deleteMany({
        roomId: roomInfo._id,
      }),
    ]);
    VibeCacheDb[GET_UP_NEXT_SONG_CACHE_KEY(roomInfo.roomId)].delete();

    DELETE_USER_CACHED_QUEUE_LIST_FOR_ROOM_ID(roomInfo.roomId);
    broadcast(io, roomInfo.roomId, "update", "update");
  } catch (error: any) {
    console.log("DELETE ALL ERROR:", error);
    errorHandler(socket, error.message);
  }
}
