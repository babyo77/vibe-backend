import { CustomSocket } from "../../types";
import { emitMessage } from "../lib/customEmit";
import Queue from "../models/queueModel";
import Vote from "../models/voteModel";
import { errorHandler } from "./error";

export async function deleteAll(socket: CustomSocket) {
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
    emitMessage(socket, roomInfo.roomId, "update", "update");
  } catch (error: any) {
    console.log("DELETE ALL ERROR:", error);
    errorHandler(socket, error.message);
  }
}
