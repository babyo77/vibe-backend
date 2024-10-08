import { CustomSocket, nextSong } from "../../types";

export async function nextSong(socket: CustomSocket, data: nextSong) {
  const { role, roomInfo } = socket;
  if (!roomInfo) return;
  if (role === "admin" && roomInfo.roomId) {
    const { nextSong } = data;

    socket.to(roomInfo.roomId).emit("nextSong", nextSong);
  }
}
