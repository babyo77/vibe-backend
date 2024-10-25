// used in new src
import { CustomSocket } from "../../types";

export async function handleSeek(socket: CustomSocket, seek?: number) {
  try {
    if (!seek) return;
    const { roomInfo, userInfo } = socket;
    if (!roomInfo) return;
    if (userInfo?.role === "admin" && roomInfo.roomId) {
      socket.to(roomInfo.roomId).emit("seek", seek || 0);
    }
  } catch (error) {
    console.log(error);
  }
}
