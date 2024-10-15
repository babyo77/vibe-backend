import { CustomSocket, searchResults } from "../../types";
import Queue from "../models/queueModel";
import { errorHandler } from "./error";

export default async function addQueue(
  socket: CustomSocket,
  data?: searchResults
) {
  try {
    const { roomInfo, userId } = socket;
    if (!roomInfo || !userId) throw new Error("Login Required");

    if (data) {
      const isAlready = await Queue.findOne({
        "songData.id": data.id,
        roomId: roomInfo._id,
      });
      if (isAlready) {
        throw new Error("Song already exists in queue");
      }
      const totalQues = await Queue.countDocuments({ roomId: roomInfo._id });
      const song = await Queue.create({
        roomId: roomInfo._id,
        songData: { ...data, addedBy: userId },
        isPlaying: totalQues == 0 ? true : false,
      });
      await Queue.findByIdAndUpdate(song._id, {
        songData: { ...song.songData, queueId: song._id.toString() },
      });
    }

    socket.emit("songQueue");
    socket.to(roomInfo.roomId).emit("songQueue");
  } catch (error: any) {
    console.log("ADDING TO QUEUE ERROR:", error.message);
    errorHandler(socket, error.message || "An unexpected error occurred");
  }
}
