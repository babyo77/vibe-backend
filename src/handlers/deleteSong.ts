// used in  new src
import { Server } from "socket.io";
import { CustomSocket } from "../../types";
import { broadcast } from "../lib/customEmit";
import { decrypt } from "../lib/lock";
import Queue from "../models/queueModel";
import Vote from "../models/voteModel";
import { errorHandler } from "./error";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export default async function deleteSong(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: CustomSocket,
  data?: any
) {
  try {
    const { roomInfo, userInfo } = socket;
    if (!roomInfo || !userInfo) throw new Error("Login Required");
    if (!data) return;
    const value = decrypt(data);

    if (userInfo.role === "admin" || value?.addedBy === userInfo.id) {
      await Queue.deleteOne({
        roomId: roomInfo?._id,
        "songData.queueId": value.queueId,
      });
      await Vote.deleteMany({ queueId: value.queueId });
      broadcast(io, roomInfo.roomId, "update", "update");
    } else {
      throw new Error("Only admin and user who added this song can delete it");
    }
  } catch (error: any) {
    console.log("DELETE ERROR:", error.message);
    errorHandler(socket, error.message || "An unexpected error occurred");
  }
}
