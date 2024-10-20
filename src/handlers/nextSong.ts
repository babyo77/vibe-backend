import { CustomSocket, nextSongT } from "../../types";
import { getMostVotedSongs, getSongsWithVoteCounts } from "../lib/utils";
import Queue from "../models/queueModel";
import Vote from "../models/voteModel";
import { errorHandler } from "./error";

export async function nextSong(socket: CustomSocket, data: nextSongT) {
  try {
    const { role, roomInfo, userId } = socket;
    if (!roomInfo || !userId || !data || !data.nextSong) return;
    if (role !== "admin" && !data?.mostVoted)
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

    await Vote.deleteMany({
      queueId: nextSong.queueId,
      roomId: roomInfo._id,
    });

    const song = await getMostVotedSongs(roomInfo._id);

    const nextSongDb =
      song[0].voteCount !== 0
        ? (
            await getSongsWithVoteCounts(
              roomInfo._id,
              userId,
              false,
              song[0].order
            )
          )[0]
        : (
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
    socket.to(roomInfo.roomId).emit("songQueue");
    socket.emit("songQueue");
  } catch (error: any) {
    console.log("NEXT SONG ERROR:", error);
    errorHandler(socket, error.message);
  }
}
