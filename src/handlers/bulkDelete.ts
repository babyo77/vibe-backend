//used in news src
import { CustomSocket, searchResults } from "../../types";
import { emitMessage } from "../lib/customEmit";
import { decrypt } from "../lib/lock";
import Queue from "../models/queueModel";
import Vote from "../models/voteModel";
import { errorHandler } from "./error";

export async function bulkDelete(socket: CustomSocket, data: any) {
  try {
    const { roomInfo, userInfo } = socket;
    if (!roomInfo || !data || data.length === 0) return;
    if (userInfo?.role !== "admin") throw new Error("only admins can delete");

    const value = decrypt(data) as searchResults[];
    const songIds = value.map((song) => song.id);
    const queueIds = value.map((song) => song.queueId);

    await Promise.all([
      await Queue.deleteMany({
        roomId: roomInfo._id,
        "songData.id": { $in: songIds },
      }),
      await Vote.deleteMany({
        roomId: roomInfo._id,
        queueId: { $in: queueIds },
      }),
    ]);
    emitMessage(socket, roomInfo.roomId, "update", "update");
  } catch (error: any) {
    console.log("BULK DELETE ERROR", error);
    errorHandler(socket, error.message);
  }
}
