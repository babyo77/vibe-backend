import { CustomSocket, searchResults } from "../../types";
import Queue from "../models/queueModel";
import Vote from "../models/voteModel";
import { errorHandler } from "./error";

export async function bulkDelete(socket: CustomSocket, data: searchResults[]) {
  try {
    const { roomInfo, role } = socket;
    if (!roomInfo || !data || data.length === 0) return;
    if (role !== "admin") throw new Error("only admins can delete");
    // Extract the song IDs from the data array
    const songIds = data.map((song) => song.id);
    const queueIds = data.map((song) => song._id);

    await Promise.all([
      await Queue.deleteMany({
        roomId: roomInfo._id,
        "songData.id": { $in: songIds }, // Ensure you match on songData.id
      }),
      await Vote.deleteMany({
        roomId: roomInfo._id,
        queueId: { $in: queueIds }, // If queueId refers to songData _id
      }),
    ]);
    socket.emit("songQueue");
    socket.to(roomInfo.roomId).emit("songQueue");
  } catch (error: any) {
    console.log("BULK DELETE ERROR", error);
    errorHandler(socket, error.message);
  }
}
