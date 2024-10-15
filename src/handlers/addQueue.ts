import { CustomSocket, searchResults } from "../../types";
import Queue from "../models/queueModel";
import { errorHandler } from "./error";

export default async function addQueue(
  socket: CustomSocket,
  data?: searchResults[]
) {
  try {
    const { roomInfo, userId } = socket;
    if (!roomInfo || !userId) throw new Error("Login Required");

    if (data && data.length > 0) {
      // Retrieve existing song IDs in a single query using lean for better performance
      const existingSongs = await Queue.find(
        { roomId: roomInfo._id },
        { "songData.id": 1 }
      ).lean();

      const existingSongIds = new Set(
        existingSongs.map((song) => song.songData.id)
      );

      // Filter out songs that are already in the queue
      const songsToAdd = data.filter((song) => !existingSongIds.has(song.id));

      if (songsToAdd.length > 0) {
        const isQueueEmpty = existingSongs.length === 0;

        // Prepare songs for bulk insertion
        const newSongs = songsToAdd.map((song, index) => ({
          roomId: roomInfo._id,
          songData: { ...song, addedBy: userId },
          isPlaying: isQueueEmpty && index === 0, // Set the first song to playing if the queue is empty
        }));

        // Insert new songs and immediately set their queueId in one step using bulkWrite
        const insertedSongs = await Queue.insertMany(newSongs);
        const updates = insertedSongs.map((song) => ({
          updateOne: {
            filter: { _id: song._id },
            update: { "songData.queueId": song._id.toString() },
          },
        }));

        // Perform bulk update to set queueId for the newly inserted songs
        if (updates.length > 0) {
          await Queue.bulkWrite(updates);
        }
      } else {
        console.log("No new songs to add to the queue.");
      }
    }

    // Emit the updated song queue to all connected clients
    socket.emit("songQueue");
    socket.to(roomInfo.roomId).emit("songQueue");
  } catch (error: any) {
    console.log("ADDING TO QUEUE ERROR:", error.message);
    errorHandler(socket, error.message || "An unexpected error occurred");
  }
}
