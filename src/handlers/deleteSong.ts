import { CustomSocket, searchResults } from "../../types";
import { getSongsWithVoteCounts } from "../lib/utils";
import Queue from "../models/queueModel";
import { errorHandler } from "./error";

export default async function deleteSong(
  socket: CustomSocket,
  data?: searchResults
) {
  try {
    const { roomInfo, userId, role } = socket;
    if (!roomInfo) return;
    if (!data) return;
    if (role === "admin" || data?.addedBy === userId) {
      await Queue.deleteOne({ roomId: roomInfo?._id, songData: data });

      const queue = await getSongsWithVoteCounts(roomInfo._id, true);

      if (queue) {
        socket.emit("songQueue", queue);

        if (data) {
          socket.to(roomInfo.roomId).emit("songQueue", queue);
        }
      }
    } else {
      throw new Error("Permission denied");
    }
  } catch (error: any) {
    console.log("DELETE ERROR:", error.message);
    errorHandler(socket, error.message || "An unexpected error occurred");
  }
}
