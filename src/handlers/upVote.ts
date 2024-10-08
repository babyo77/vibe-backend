import { CustomSocket, searchResults } from "../../types";
import { getVotesArray, getSongsWithVoteCounts } from "../lib/utils";
import Vote from "../models/voteModel";
import { errorHandler } from "./error";
import mongoose from "mongoose"; // Make sure you have mongoose imported

export default async function upVote(
  socket: CustomSocket,
  data?: searchResults
) {
  // Start a MongoDB session
  const session = await mongoose.startSession();

  try {
    session.startTransaction(); // Start the transaction

    const { roomInfo, userId } = socket;
    if (!roomInfo) return;

    if (!data) {
      const votes = await getVotesArray(roomInfo._id, userId);
      const queue = await getSongsWithVoteCounts(roomInfo._id);

      socket.emit("votes", { votes, queue });
      return;
    }

    if (!data.queueId) return;

    // Check if the vote already exists within the session
    const isAlreadyVoted = await Vote.findOne({
      roomId: roomInfo._id,
      userId,
      queueId: data.queueId,
    }).session(session); // Query using the session

    if (!isAlreadyVoted) {
      // If the vote doesn't exist, create it inside the session
      await Vote.create(
        [
          {
            roomId: roomInfo._id,
            userId,
            queueId: data.queueId,
          },
        ],
        { session }
      );
    } else {
      // If the vote exists, delete it inside the session
      await Vote.deleteOne({
        roomId: roomInfo._id,
        userId,
        queueId: data.queueId,
      }).session(session);
    }

    // Emit the updated votes (still within the session)
    const votes = await getVotesArray(roomInfo._id, userId);
    const queue = await getSongsWithVoteCounts(roomInfo._id);

    socket.emit("votes", { votes, queue });
    socket.to(roomInfo.roomId).emit("getVotes");

    // Commit the transaction after all operations succeed
    await session.commitTransaction();
  } catch (error: any) {
    console.log("UPVOTE ERROR:", error.message);
    errorHandler(socket, error.message || "An unexpected error occurred");

    // Abort the session in case of any error
    await session.abortTransaction();
  } finally {
    session.endSession(); // End the session
  }
}
