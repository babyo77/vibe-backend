import { CustomSocket, searchResults } from "../../types";
import { errorHandler } from "../handlers/error";
import Vote from "../models/voteModel";
import { nextSong } from "./nextSong";
export async function songEnded(socket: CustomSocket, data?: searchResults) {
  try {
    const { roomInfo, userId } = socket;
    if (!data) return;
    if (!roomInfo || !userId) throw new Error("Login Required");

    await Vote.deleteMany({
      queueId: data.queueId,
      roomId: roomInfo._id,
    });

    nextSong(socket, { nextSong: data, mostVoted: true });
  } catch (error: any) {
    console.log("SONGEND ERROR:", error.message);
    errorHandler(socket, error.message);
  }
}
