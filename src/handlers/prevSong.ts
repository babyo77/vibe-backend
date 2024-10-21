import { CustomSocket, prevSongT } from "../../types";
import { getSongsWithVoteCounts } from "../lib/utils";
import Queue from "../models/queueModel";
import Vote from "../models/voteModel";
import { errorHandler } from "./error";

export async function prevSong(socket: CustomSocket, data: prevSongT) {
  try {
    const { role, roomInfo, userId } = socket;
    if (!roomInfo || !userId || !data || !data.prevSong) return;
    if (role !== "admin" && !data.roomId)
      throw new Error("Only admin can do this");
    const { prevSong } = data;
    await Queue.updateOne(
      { roomId: roomInfo._id, isPlaying: true },
      {
        isPlaying: false,
      }
    );
    await Vote.deleteMany({
      queueId: prevSong.queueId,
      roomId: roomInfo._id,
    });
    const nextSongDb = (
      await getSongsWithVoteCounts(
        roomInfo._id,
        userId,
        false,
        prevSong.order + -1
      )
    )[0];

    await Queue.updateOne(
      {
        roomId: roomInfo._id,
        "songData.id": nextSongDb.id,
      },
      { isPlaying: true }
    );

    socket.emit("nextSong", nextSongDb);
    socket.emit("updateUpNextSongs");
    socket.to(roomInfo.roomId).emit("updateUpNextSongs");
    socket.to(roomInfo.roomId).emit("nextSong", nextSongDb);
  } catch (error: any) {
    console.log("PREV SONG ERROR: " + error.message);

    errorHandler(socket, error.message);
  }
}
