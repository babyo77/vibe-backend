import { CustomSocket, searchResults } from "../../types";
import { getVotesArray, getSongsWithVoteCounts } from "../lib/utils";
import Vote from "../models/voteModel";
import { errorHandler } from "./error";

export default async function upVote(
  socket: CustomSocket,
  data?: searchResults
) {
  try {
    const { roomInfo, userId } = socket;

    // Check if roomInfo is available
    if (!roomInfo) {
      console.error("Room info is missing.");
      return;
    }
    if (!userId) return;
    // If no data provided, fetch votes and queue
    if (!data) {
      const queue = await getSongsWithVoteCounts(roomInfo._id, userId);

      socket.emit("votes", { queue });
      return;
    }

    // Ensure queueId is present
    if (!data.queueId) {
      console.error("Queue ID is missing in the data.");
      return;
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

    // Fetch updated votes and queue
    const queue = await getSongsWithVoteCounts(roomInfo._id, userId, true);

    // Emit the updated votes and queue to the user
    socket.emit("votes", { queue });

    // Emit updated votes to everyone else in the room
    socket.to(roomInfo.roomId).emit("getVotes");
  } catch (error: any) {
    console.log("UPVOTE ERROR:", error.message);

    // Emit error via errorHandler
    errorHandler(socket, error.message || "An unexpected error occurred");
  }
}
