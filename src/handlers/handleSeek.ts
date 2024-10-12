import { CustomSocket } from "../../types";

export async function handleSeek(socket: CustomSocket, seek?: number) {
  try {
    if (!seek) return;
    const { roomInfo, role, userId } = socket;
    if (!roomInfo) return;
    if (role === "admin" && roomInfo.roomId) {
      socket.to(roomInfo.roomId).emit("seek", { seek, role, userId });
    }
  } catch (error) {
    console.log(error);
  }
}
