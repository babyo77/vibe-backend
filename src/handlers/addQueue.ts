import { Server } from "socket.io";
import { CustomSocket, searchResults } from "../../types";
import Queue from "../models/queueModel";
import { errorHandler } from "./error";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { broadcast } from "../lib/customEmit";

export default async function addQueue(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: CustomSocket,
  data: searchResults[]
) {
  const session = await Queue.startSession(); // Start a session for transaction
  session.startTransaction(); // Start transaction

  try {
    const { roomInfo, userInfo } = socket;
    if (!roomInfo || !userInfo) throw new Error("Login required.");

    const existingSongs = await Queue.find({ roomId: roomInfo._id })
      .select("songData")
      .lean()
      .session(session); // Use session for transaction
    const existingSongIds = new Set(
      existingSongs.map((song) => song.songData.id)
    );
    const songsToAdd = data.filter((song) => !existingSongIds.has(song.id));

    if (songsToAdd.length > 0) {
      const newSongs = songsToAdd.map((song, index) => ({
        roomId: roomInfo._id,
        isPlaying: existingSongs.length === 0 && index === 0,
        songData: { ...song, addedBy: userInfo.id },
        order: existingSongs.length + index + 1, // Maintain order based on existing songs
      }));

      const insertedSongs = await Queue.insertMany(newSongs, { session }); // Insert with session

      // Prepare bulk updates
      const updates = insertedSongs.map((song) => ({
        updateOne: {
          filter: { _id: song._id },
          update: { "songData.queueId": song._id.toString() },
        },
      }));

      if (updates.length > 0) {
        await Queue.bulkWrite(updates, { session }); // Bulk write with session
      }
    }

    await session.commitTransaction(); // Commit transaction
    broadcast(io, roomInfo.roomId, "update", "update");
  } catch (error: any) {
    await session.abortTransaction(); // Abort transaction on error
    console.error("Error adding songs to queue:", error.message);
    errorHandler(socket, error.message);
  } finally {
    session.endSession(); // End the session
  }
}
