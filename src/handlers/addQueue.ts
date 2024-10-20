import { CustomSocket, searchResults } from "../../types";
import Queue from "../models/queueModel";
import { errorHandler } from "./error";

export default async function addQueue(
  socket: CustomSocket,
  data: searchResults[]
) {
  try {
    const { roomInfo, userId } = socket;
    if (!roomInfo || !userId) throw new Error("Room information is required.");

    const existingSongs = await Queue.find({ roomId: roomInfo._id })
      .select("songData")
      .lean();
    const existingSongIds = new Set(
      existingSongs.map((song) => song.songData.id)
    );
    const songsToAdd = data.filter((song) => !existingSongIds.has(song.id));

    if (songsToAdd.length > 0) {
      const newSongs = songsToAdd.map((song, index) => ({
        roomId: roomInfo?._id,
        isPlaying: existingSongs.length === 0 && index === 0,
        songData: { ...song, addedBy: userId },
        order: existingSongs.length + index + 1, // Maintain order based on existing songs
      }));

      const insertedSongs = await Queue.insertMany(newSongs);
      const updates = insertedSongs.map((song) => ({
        updateOne: {
          filter: { _id: song._id },
          update: { "songData.queueId": song._id.toString() },
        },
      }));
      if (updates.length > 0) {
        await Queue.bulkWrite(updates);
      }
    }

    socket.emit("songQueue");
    socket.to(roomInfo.roomId).emit("songQueue");
  } catch (error: any) {
    console.error("Error adding songs to queue:", error.message);
    errorHandler(socket, error.message);
  }
}
