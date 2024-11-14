//used in new src
import { Server } from "socket.io";
import { CustomSocket, searchResults } from "../../types";
import { getCurrentlyPlaying, getSongByOrder } from "../lib/utils";
import { errorHandler } from "./error";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { broadcast } from "../lib/customEmit";
import Queue from "../models/queueModel";
import Vote from "../models/voteModel";
import RoomUser from "../models/roomUsers";
import { VibeCache } from "../cache/cache";

export async function SongEnded(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: CustomSocket
) {
  try {
    const { roomInfo, userInfo } = socket;
    if (!roomInfo) throw new Error("Login required");
    let isAdminOnline = null;
    if (VibeCache.has(roomInfo._id + "isaAminOnline")) {
      isAdminOnline = VibeCache.get(roomInfo._id + "isaAminOnline");
    } else {
      isAdminOnline = await RoomUser.findOne({
        roomId: roomInfo?._id,
        role: "admin",
        active: true,
        status: true,
      });
    }
    VibeCache.set(roomInfo._id + "isaAminOnline", isAdminOnline);
    if (isAdminOnline && userInfo?.role !== "admin") return;
    let nextSong = [];
    const value = VibeCache.has(roomInfo.roomId + "isplaying")
      ? (VibeCache.get(roomInfo.roomId + "isplaying") as searchResults)
      : (await getCurrentlyPlaying(roomInfo._id, userInfo?.id))[0];

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
      nextSong = await getSongByOrder(roomInfo?._id, value.order);
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
    VibeCache.set(roomInfo.roomId + "isplaying", nextSong[0]);
    broadcast(io, roomInfo.roomId, "play", nextSong[0]);
    broadcast(io, roomInfo.roomId, "update", "update");
  } catch (error: any) {
    console.log("NEXT SONG ERROR:", error);
    errorHandler(socket, error.message);
  }
}
