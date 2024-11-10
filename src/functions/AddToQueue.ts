import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import mongoose from "mongoose";
import Queue from "../models/queueModel";
import Room from "../models/roomModel";
import { searchResults } from "../../types";

// Define Counter Schema if not already defined
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 },
});

// Create Counter model if not exists
const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

class QueueError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = "QueueError";
  }
}

const MAX_RETRIES = 500;
const RETRY_DELAY = 100; // milliseconds

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to get next sequence of orders atomically
const getNextSequence = async (
  roomId: string,
  count: number,
  session: mongoose.ClientSession
) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: `queue_order_${roomId}` },
    { $inc: { seq: count } },
    {
      new: true,
      upsert: true,
      session,
      setDefaultsOnInsert: true,
    }
  );

  return counter.seq - count + 1; // Return the starting sequence
};

export const addToQueue = async (req: CustomRequest, res: Response) => {
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        body: data,
        query: { room: roomId },
        userId,
      } = req;

      if (!userId || !roomId) {
        throw new QueueError(
          !userId ? "Invalid userId" : "Room ID is required",
          400
        );
      }

      const room = await Room.findOne({ roomId }).session(session);

      if (!room) {
        throw new QueueError("Invalid roomId", 404);
      }

      // Get existing songs to check for duplicates
      const existingSongs = await Queue.find(
        { roomId: room._id },
        { "songData.id": 1, isPlaying: 1 }
      ).session(session);

      const existingSongIds = new Set(
        existingSongs.map((song) => song.songData.id)
      );

      // Filter duplicates
      const songsToAdd = data.filter(
        (song: searchResults) => !existingSongIds.has(song.id)
      );

      if (songsToAdd.length === 0) {
        await session.commitTransaction();
        return res.status(400).json({
          message: "All songs already exist in queue.",
        });
      }

      // Get starting order number atomically
      const startingOrder = await getNextSequence(
        room._id.toString(),
        songsToAdd.length,
        session
      );

      // Prepare new songs with guaranteed unique order numbers
      const newSongs = songsToAdd.map((song: searchResults, index: number) => ({
        roomId: room._id,
        isPlaying: existingSongs.length === 0 && index === 0,
        songData: {
          ...song,
          addedBy: userId,
        },
        order: startingOrder + index,
      }));

      // Insert songs
      const insertedSongs = await Queue.insertMany(newSongs, {
        session,
        ordered: true,
      });

      const updates = insertedSongs.map((song) => ({
        updateOne: {
          filter: { _id: song._id },
          update: { "songData.queueId": song._id.toString() },
        },
      }));
      if (updates.length > 0) {
        await Queue.bulkWrite(updates, { session });
      }
      await session.commitTransaction();

      return res.json({
        message: "Songs added to the queue successfully",
        count: insertedSongs.length,
        songs: insertedSongs.map((song) => ({
          id: song._id,
          order: song.order,
        })),
      });
    } catch (error: any) {
      await session.abortTransaction();

      if (
        error.message.includes("Write conflict") ||
        error.message.includes("transaction")
      ) {
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          console.log(
            `Retrying operation (attempt ${retryCount + 1}/${MAX_RETRIES})`
          );
          await sleep(RETRY_DELAY * retryCount);
          continue;
        }
      }

      if (error instanceof QueueError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      console.error("Queue error:", error.message, error.stack);
      return res.status(500).json({
        error: "Operation failed after retries",
        details: error.message,
      });
    } finally {
      session.endSession();
    }
  }
};

// Required indexes
/*
await Queue.collection.createIndex({ roomId: 1, order: 1 });
await Queue.collection.createIndex({ "songData.id": 1 });
await Room.collection.createIndex({ roomId: 1 }, { unique: true });
await Counter.collection.createIndex({ _id: 1 }, { unique: true });
*/
