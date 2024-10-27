import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import mongoose from "mongoose";
import Queue from "../models/queueModel";
import Room from "../models/roomModel";
import { searchResults } from "../../types";

export const addToQueue = async (req: CustomRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction(); // Start the transaction

  try {
    const data = req.body; // Expecting `data` to be an array of song objects
    const roomId = String(req.query.room);
    const userId = req.userId;
    if (!userId) throw new Error("Invalid userId");

    if (!roomId) throw new Error("Room ID is required.");

    const room = await Room.findOne({ roomId }).session(session);
    if (!room) throw new Error("Invalid roomId");

    // Fetch existing songs in the queue for the room
    const existingSongs = await Queue.find({ roomId: room._id })
      .select("songData order")
      .lean()
      .session(session);

    const existingSongIds = new Set(
      existingSongs.map((song) => song.songData.id)
    );

    // Filter out songs that are not already in the queue
    const songsToAdd = data.filter(
      (song: searchResults) => !existingSongIds.has(song.id)
    );

    if (songsToAdd.length === 0) {
      // No new songs to add, commit transaction and return
      await session.commitTransaction();
      return res.status(400).json({ message: "Song already exists in queue." });
    }

    // Get the maximum order directly from the database
    const maxOrderResult = await Queue.aggregate([
      { $match: { roomId: room._id } },
      { $group: { _id: null, maxOrder: { $max: "$order" } } },
    ]).session(session);

    const maxOrder = maxOrderResult.length > 0 ? maxOrderResult[0].maxOrder : 0;

    // Prepare new songs to be inserted with incremented order
    const newSongs = songsToAdd.map((song: searchResults, index: number) => ({
      roomId: room._id,
      isPlaying: existingSongs.length === 0 && index === 0,
      songData: { ...song, addedBy: userId },
      order: maxOrder + index + 1,
    }));

    // Insert new songs and update `queueId` in bulk
    const insertedSongs = await Queue.insertMany(newSongs, { session });
    const updates = insertedSongs.map((song) => ({
      updateOne: {
        filter: { _id: song._id },
        update: { "songData.queueId": song._id.toString() },
      },
    }));

    if (updates.length > 0) {
      await Queue.bulkWrite(updates, { session });
    }

    // Commit the transaction after successful insert and update
    await session.commitTransaction();
    res.json({ message: "Songs added to the queue successfully." });
  } catch (error: any) {
    await session.abortTransaction(); // Rollback transaction on error
    console.error("Error adding songs to queue:", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession(); // End the session
  }
};
