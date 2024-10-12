import { CustomSocket, prevSongT } from "../../types";
import { getSongsWithVoteCounts } from "../lib/utils";
import Queue from "../models/queueModel";
import { errorHandler } from "./error";

export async function prevSong(socket: CustomSocket, data: prevSongT) {
  const { role, roomInfo, userId } = socket;
  if (!roomInfo) return;
  if (!userId) return;
  if (!data) return;
  if (role === "admin" && roomInfo.roomId) {
    const { prevSong } = data;
    await Queue.updateMany({ roomId: roomInfo._id }, { isPlaying: false });
    if (!prevSong) return;
    const queue = await getSongsWithVoteCounts(roomInfo._id, userId, true);
    let nextSong = queue[0];
    const currentSongIndex = queue.findIndex((song) => song.id === prevSong.id); // Assuming data.id contains the ID of the ended song

    // Handle edge cases (ended song not found in queue)
    if (currentSongIndex === -1) {
      nextSong = queue[0];
    }

    // Calculate the index of the next song
    const nextSongIndex = (currentSongIndex + 1) % queue.length; // Wrap around to the beginning if it's the last song

    // Get the next song based on the calculated index
    nextSong = queue[nextSongIndex];

    await Queue.updateOne(
      {
        roomId: roomInfo._id,
        "songData.id": nextSong.id,
      },
      { isPlaying: true }
    );

    socket.emit("prevSong", nextSong);

    socket.to(roomInfo.roomId).emit("prevSong", nextSong);
  } else {
    errorHandler(socket, "only admin can play prevSong");
  }
}
