import { CustomSocket } from "../../types";
import Queue from "../models/queueModel";
import Vote from "../models/voteModel";
import { errorHandler } from "./error";

export async function deleteAll(socket: CustomSocket) {
  try {
    const { roomInfo, role } = socket;
    if (!roomInfo) return;
    if (role !== "admin") throw new Error("only admins can delete");
    await Promise.all([
      await Queue.deleteMany({
        roomId: roomInfo._id,
        isPlaying: false,
      }),
      await Vote.deleteMany({
        roomId: roomInfo._id,
      }),
    ]);

    socket.to(roomInfo.roomId).emit("addToQueue");
  } catch (error: any) {
    console.log("DELETE ALL ERROR:", error);
    errorHandler(socket, error.message);
  }
}
