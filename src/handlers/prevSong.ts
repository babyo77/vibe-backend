import { CustomSocket, prevSong } from "../../types";

export async function prevSong(socket: CustomSocket, data: prevSong) {
  const { role, roomInfo } = socket;
  if (!roomInfo) return;
  if (role === "admin" && roomInfo.roomId) {
    const { prevSong } = data;

    socket.to(roomInfo.roomId).emit("prevSong", prevSong);
  }
}
