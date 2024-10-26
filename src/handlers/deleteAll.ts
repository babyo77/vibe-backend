import { Server } from "socket.io";
import { CustomSocket } from "../../types";
import { broadcast } from "../lib/customEmit";
import Queue from "../models/queueModel";
import Vote from "../models/voteModel";
import { errorHandler } from "./error";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

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
      await Queue.deleteMany({
        roomId: roomInfo._id,
        isPlaying: false,
      }),
      await Vote.deleteMany({
        roomId: roomInfo._id,
      }),
    ]);
    broadcast(io, roomInfo.roomId, "update", "update");
  } catch (error: any) {
    console.log("DELETE ALL ERROR:", error);
    errorHandler(socket, error.message);
  }
}
