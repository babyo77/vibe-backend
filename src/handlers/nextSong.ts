//used in new src
import { Server } from "socket.io";
import { CustomSocket } from "../../types";
import { getCurrentlyPlaying, getSongByOrder } from "../lib/utils";
import { errorHandler } from "./error";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { broadcast } from "../lib/customEmit";
import Queue from "../models/queueModel";
import Vote from "../models/voteModel";

export async function PlayNextSong(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: CustomSocket
) {
  try {
    const { roomInfo, userInfo } = socket;
    if (!roomInfo || !userInfo) throw new Error("Login required");
    if (userInfo.role !== "admin")
      throw new Error("Only admin is allowed to play next");
    let nextSong = [];
    const value = (await getCurrentlyPlaying(roomInfo._id, userInfo.id))[0];
    await Queue.updateOne(
      { roomId: roomInfo._id, isPlaying: true },
      {
        isPlaying: false,
      }
    ),
      (nextSong = await getCurrentlyPlaying(roomInfo?._id, userInfo.id, false));
    if (nextSong?.length == 0) {
      nextSong = await getSongByOrder(roomInfo?._id, value.order);
    }
    if (nextSong.length == 0) {
      await Queue.updateOne(
        {
          roomId: roomInfo._id,
          "songData.id": value.id,
        },
        { isPlaying: true }
      );
      throw new Error("No more songs in the queue");
    }
    await Queue.updateOne(
      {
        roomId: roomInfo._id,
        "songData.id": nextSong[0].id,
      },
      { isPlaying: true }
    ),
      await Vote.deleteMany({
        roomId: roomInfo._id,
        queueId: nextSong[0].queueId,
      });
    broadcast(io, roomInfo.roomId, "play", nextSong[0]);
    broadcast(io, roomInfo.roomId, "update", "update");
  } catch (error: any) {
    console.log("NEXT SONG ERROR:", error);
    errorHandler(socket, error.message);
  }
}
