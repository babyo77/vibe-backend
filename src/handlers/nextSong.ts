import { CustomSocket, nextSongT } from "../../types";
import { getSongsWithVoteCounts } from "../lib/utils";
import Queue from "../models/queueModel";
import { errorHandler } from "./error";

export async function nextSong(socket: CustomSocket, data: nextSongT) {
  const { role, roomInfo, userId } = socket;
  if (!roomInfo) return;
  if (!userId) return;
  if (!data) return;
  if (role === "admin" && roomInfo.roomId) {
    const { nextSong, callback } = data;
    if (!nextSong) return;
    await Queue.updateMany({ roomId: roomInfo._id }, { isPlaying: false });

    const queue = await getSongsWithVoteCounts(roomInfo._id, userId, true);
    let prevSong = queue[0];
    const currentSongIndex = queue.findIndex((song) => song.id === nextSong.id); // Assuming data.id contains the ID of the ended song

    // Handle edge cases (ended song not found in queue)
    if (currentSongIndex === -1) {
      prevSong = queue[0];
    }

    // Calculate the index of the next song
    const nextSongIndex = (currentSongIndex + 1) % queue.length; // Wrap around to the beginning if it's the last song

    // Get the next song based on the calculated index
    prevSong = queue[nextSongIndex];

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

    await Queue.updateOne(
      {
        roomId: roomInfo._id,
        "songData.id": prevSong.id,
      },
      { isPlaying: true }
    );
    socket.emit("nextSong", prevSong);

    socket.to(roomInfo.roomId).emit("nextSong", prevSong);
  } else {
    errorHandler(socket, "only admin can play nextSong");
  }
}
