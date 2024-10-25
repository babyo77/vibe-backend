import { Server } from "socket.io";
import { CustomSocket } from "../../types";
import { broadcast } from "../lib/customEmit";
import { decrypt } from "../lib/lock";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import Queue from "../models/queueModel";
import { errorHandler } from "./error";
import Vote from "../models/voteModel";

export async function handlePlay(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: CustomSocket,
  song: any
) {
  try {
    const { roomInfo, userInfo } = socket;
    if (!roomInfo || !song) return;
    if (userInfo?.role !== "admin") return;
    const value = decrypt(song);

    await Queue.updateOne(
      { roomId: roomInfo._id, isPlaying: true },
      {
        isPlaying: false,
      }
    ),
      await Queue.updateOne(
        {
          roomId: roomInfo._id,
          "songData.id": value.id,
        },
        { isPlaying: true }
      ),
      await Vote.deleteMany({
        roomId: roomInfo._id,
        queueId: value.currentQueueId,
      });

    broadcast(io, roomInfo.roomId, "play", value);
    broadcast(io, roomInfo.roomId, "update", "update");
  } catch (error: any) {
    console.log("PLAY ERROR: " + error);

    errorHandler(socket, error.message);
  }
}
