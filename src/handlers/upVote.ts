import { Server } from "socket.io";
import { CustomSocket, searchResults } from "../../types";
import { getSongsWithVoteCounts } from "../lib/utils";
import Vote from "../models/voteModel";
import { errorHandler } from "./error";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export default async function upVote(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: CustomSocket,
  data?: searchResults
) {
  try {
    const { roomInfo, userId } = socket;

    // Check if roomInfo is available
    if (!roomInfo) {
      throw new Error("Room info is missing.");
    }
    if (!userId) return;
    // If no data provided, fetch votes and queue
    if (!data) {
      const queue = await getSongsWithVoteCounts(roomInfo._id, userId);
      socket.emit("votes", queue);
      io.to(roomInfo.roomId).emit("updateUpNextSongs");
      return;
    }

    // Ensure queueId is present
    if (!data.queueId) {
      throw new Error("Queue ID is missing in the data.");
    }

    // Check if the user has already voted
    const isAlreadyVoted = await Vote.findOne({
      roomId: roomInfo._id,
      userId,
      queueId: data.queueId,
    });

    if (!isAlreadyVoted) {
      // If not voted, create a new vote
      console.log(`User ${userId} is voting for queueId ${data.queueId}`);
      await Vote.create({
        roomId: roomInfo._id,
        userId,
        queueId: data.queueId,
      });
    } else {
      // If already voted, remove the vote (toggle)
      console.log(`User ${userId} is un-voting for queueId ${data.queueId}`);
      await Vote.deleteOne({
        roomId: roomInfo._id,
        userId,
        queueId: data.queueId,
      });
    }

    // Emit updated votes to everyone else in the room
    io.to(roomInfo.roomId).emit("getVotes");
  } catch (error: any) {
    console.log("UPVOTE ERROR:", error.message);

    // Emit error via errorHandler
    errorHandler(socket, error.message || "An unexpected error occurred");
  }
}
