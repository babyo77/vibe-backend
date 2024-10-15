import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { CustomSocket } from "../../types";
import { Server } from "socket.io";

export async function sendHeart(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: CustomSocket,
  data: any
) {
  const { roomInfo } = socket;
  if (!roomInfo) return;
  io.to(roomInfo.roomId).emit("heart", data);
}
