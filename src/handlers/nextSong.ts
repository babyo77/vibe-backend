import { CustomSocket, nextSong } from "../../types";
import { getSongsWithVoteCounts } from "../lib/utils";
import { errorHandler } from "./error";

export async function nextSong(socket: CustomSocket, data: nextSong) {
  const { role, roomInfo } = socket;
  if (!roomInfo) return;
  if (role === "admin" && roomInfo.roomId) {
    const { nextSong } = data;
    const queue = await getSongsWithVoteCounts(roomInfo._id, true);
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

    socket.emit("nextSong", prevSong);

    socket.to(roomInfo.roomId).emit("nextSong", prevSong);
  } else {
    errorHandler(socket, "only admin can play nextSong");
  }
}
