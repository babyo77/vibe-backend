import { CustomSocket, nextSongT } from "../../types";
import { getSongsWithVoteCounts } from "../lib/utils";
import Queue from "../models/queueModel";
import { errorHandler } from "./error";

export async function nextSong(socket: CustomSocket, data: nextSongT) {
  try {
    const { role, roomInfo, userId } = socket;
    if (!roomInfo || !userId || !data || !data.nextSong) return;
    if (role !== "admin" && !data.roomId)
      throw new Error("Only admin can do this");
    const { nextSong, callback } = data;
    await Queue.updateOne(
      { roomId: roomInfo._id, isPlaying: true },
      {
        isPlaying: false,
      }
    );
    if (callback) {
      await Queue.updateOne(
        {
          roomId: roomInfo._id,
          "songData.id": nextSong.id,
        },
        { isPlaying: true }
      );
      socket.emit("nextSong", nextSong);
      socket.to(roomInfo.roomId).emit("nextSong", nextSong);
      return;
    }

    const nextSongDb = (
      await getSongsWithVoteCounts(
        roomInfo._id,
        userId,
        false,
        nextSong.order + 1
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

    socket.to(roomInfo.roomId).emit("nextSong", nextSongDb);
  } catch (error: any) {
    console.log("NEXT SONG ERROR:", error.message);
    errorHandler(socket, error.message);
  }
}
