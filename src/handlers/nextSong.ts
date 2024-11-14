//used in new src
import { Server } from "socket.io";
import { CustomSocket, searchResults } from "../../types";
import { getCurrentlyPlaying, getSongByOrder } from "../lib/utils";
import { errorHandler } from "./error";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { broadcast } from "../lib/customEmit";
import Queue from "../models/queueModel";
import Vote from "../models/voteModel";
import { VibeCache } from "../cache/cache";

export async function PlayNextSong(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: CustomSocket
) {
  try {
    const { roomInfo, userInfo } = socket;
    if (!roomInfo || !userInfo) throw new Error("Login required");
    if (userInfo.role !== "admin")
      throw new Error("Only admin is allowed to play next");
    let nextSong: any = [];
    const value = VibeCache.has(roomInfo.roomId + "isplaying")
      ? (VibeCache.get(roomInfo.roomId + "isplaying") as searchResults)
      : (await getCurrentlyPlaying(roomInfo._id, userInfo.id))[0];
    await Queue.updateOne(
      { roomId: roomInfo._id, isPlaying: true },
      {
        isPlaying: false,
      }
    );
    nextSong = await getCurrentlyPlaying(roomInfo?._id, userInfo.id, false);
    if (nextSong?.length == 0) {
      nextSong = await getSongByOrder(
        roomInfo?._id,
        value.order,
        userInfo?.id,
        value
      );
    }
    if (!nextSong[0].suggestedOrder) {
      await Promise.all([
        Queue.updateOne(
          {
            roomId: roomInfo._id,
            "songData.id": nextSong[0].id,
          },
          { isPlaying: true }
        ),
        Vote.deleteMany({
          roomId: roomInfo._id,
          queueId: nextSong[0].queueId,
        }),
      ]);
    }
    VibeCache.set(roomInfo.roomId + "isplaying", nextSong[0]);
    broadcast(io, roomInfo.roomId, "play", nextSong[0]);
    broadcast(io, roomInfo.roomId, "update", "update");
  } catch (error: any) {
    console.log("NEXT SONG ERROR:", error);
    errorHandler(socket, error.message);
  }
}
