import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { CustomSocket } from "../../types";
import { Server } from "socket.io";

export async function sendHeart(socket: CustomSocket, data: any) {
  const { roomInfo } = socket;
  if (!roomInfo) return;
  socket.to(roomInfo.roomId).emit("heart", data);
}
