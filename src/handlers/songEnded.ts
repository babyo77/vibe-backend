//used in new src
import { Server } from "socket.io";
import { CustomSocket } from "../../types";
import {
  DELETE_USER_CACHED_QUEUE_LIST_FOR_ROOM_ID,
  GET_CURRENTLY_PLAYING,
  getCurrentlyPlaying,
  getSongByOrder,
  IS_EMITTER_ON,
} from "../lib/utils";
import { errorHandler } from "./error";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { broadcast } from "../lib/customEmit";
import Queue from "../models/queueModel";
import Vote from "../models/voteModel";
import redisClient from "../cache/redis";

export async function SongEnded(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: CustomSocket
) {
  try {
    const { roomInfo, userInfo } = socket;
    if (!roomInfo) throw new Error("Login required");

    const isEmitterOnline = IS_EMITTER_ON(roomInfo.roomId);

    if (isEmitterOnline) return;
    let nextSong = [];
    const value = await GET_CURRENTLY_PLAYING(socket);

    await Queue.updateOne(
      { roomId: roomInfo._id, isPlaying: true },
      {
        isPlaying: false,
      }
    ),
      (nextSong = await getCurrentlyPlaying(
        roomInfo?._id,
        userInfo?.id,
        false
      ));
    if (nextSong?.length == 0) {
      nextSong = await getSongByOrder(
        roomInfo?._id,
        value?.order,
        userInfo?.id,
        value
      );
    }

    await Promise.all([
      Queue.updateOne(
        {
          roomId: roomInfo._id,
          "songData.id": nextSong[0].id,
        },
        { isPlaying: true }
      ),
      await Vote.deleteMany({
        roomId: roomInfo._id,
        queueId: nextSong[0].queueId,
      }),
    ]);
    DELETE_USER_CACHED_QUEUE_LIST_FOR_ROOM_ID(roomInfo.roomId);
    await redisClient.set(roomInfo.roomId + "isplaying", nextSong[0]);
    broadcast(io, roomInfo.roomId, "play", nextSong[0]);
    broadcast(io, roomInfo.roomId, "update", "update");
  } catch (error: any) {
    console.log("NEXT SONG ERROR:", error);
    errorHandler(socket, error.message);
  }
}
