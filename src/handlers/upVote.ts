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
    if (!roomInfo) return;
    if (!data) {
      const votes = await getVotesArray(roomInfo._id, userId);
      const queue = await getSongsWithVoteCounts(roomInfo._id);

      socket.emit("votes", { votes, queue });
      return;
    }
    if (!data.queueId) return;
    const isAlreadyVoted = await Vote.findOne({
      roomId: roomInfo._id,
      userId,
      queueId: data.queueId,
    });
    if (!isAlreadyVoted) {
      await Vote.create({
        roomId: roomInfo._id,
        userId,
        queueId: data.queueId,
      });
    } else {
      await Vote.deleteOne({
        roomId: roomInfo._id,
        userId,
        queueId: data.queueId,
      });
    }
    const votes = await getVotesArray(roomInfo._id, userId);
    const queue = await getSongsWithVoteCounts(roomInfo._id);

    socket.emit("votes", { votes, queue });
    socket.to(roomInfo.roomId).emit("getVotes");
  } catch (error: any) {
    console.log("UPVOTE ERROR:", error.message);
    errorHandler(socket, error.message || "An unexpected error occurred");
  }
}
