import { CustomSocket } from "../../types";
import { getSongsWithVoteCounts } from "../lib/utils";
import { errorHandler } from "./error";

export async function getQueueList(socket: CustomSocket) {
  try {
    const { roomInfo, userId, shuffle } = socket;
    if (!roomInfo || !userId) throw new Error("Login to Required");
    const queue = await getSongsWithVoteCounts(
      roomInfo._id,
      userId,
      false,
      shuffle
    );
    console.log(shuffle);

    socket.emit("queueList", queue);
  } catch (error: any) {
    errorHandler(socket, error.message);
  }
}
