import { CustomSocket, searchResults } from "../../types";
import { getSongsWithVoteCounts } from "../lib/utils";
import Queue from "../models/queueModel";
import { errorHandler } from "./error";

export default async function addQueue(
  socket: CustomSocket,
  data?: searchResults
) {
  try {
    const { roomInfo, userId } = socket;
    if (!roomInfo) return;

    if (data) {
      const isAlready = await Queue.findOne({ "songData._id": data.id });
      if (isAlready) {
        throw new Error("Song already exists in queue");
      }
      const song = await Queue.create({
        roomId: roomInfo._id,
        songData: { ...data, addedBy: userId },
        playing: true,
      });
      await Queue.findByIdAndUpdate(song._id, {
        songData: { ...song.songData, queueId: song._id.toString() },
      });
    }

    const queue = await getSongsWithVoteCounts(roomInfo._id);

    if (queue) {
      socket.emit("songQueue", queue);

      if (data) {
        socket.to(roomInfo.roomId).emit("songQueue", queue);
      }
    }
  } catch (error: any) {
    console.log("ADDING TO QUEUE ERROR:", error.message);
    errorHandler(socket, error.message || "An unexpected error occurred");
  }
}
