import { CustomSocket, searchResults } from "../../types";
import { getSongsWithVoteCounts } from "../lib/utils";
import Queue from "../models/queueModel";
import Vote from "../models/voteModel";
import { errorHandler } from "./error";

export default async function deleteSong(
  socket: CustomSocket,
  data?: searchResults
) {
  try {
    const { roomInfo, userId, role } = socket;
    if (!roomInfo || !userId) throw new Error("Login Required");
    if (!data) return;
    if (role === "admin" || data?.addedBy === userId) {
      await Queue.deleteOne({
        roomId: roomInfo?._id,
        "songData.queueId": data.queueId,
      });
      await Vote.deleteMany({ queueId: data.queueId });
      const queue = await getSongsWithVoteCounts(roomInfo._id, userId);

      if (queue) {
        socket.emit("songQueue", queue);

        if (data) {
          socket.to(roomInfo.roomId).emit("songQueue", queue);
        }
      }
    } else {
      throw new Error("Only admin and user who added this song can delete it");
    }
  } catch (error: any) {
    console.log("DELETE ERROR:", error.message);
    errorHandler(socket, error.message || "An unexpected error occurred");
  }
}
