import { Server } from "socket.io";
import { CustomSocket } from "../../types";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export async function handleLoop(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: CustomSocket,
  looped: boolean
) {
  try {
    const { roomInfo, role } = socket;
    if (!roomInfo) return;
    if (role === "admin") {
      io.to(roomInfo.roomId).emit("loop", looped);
    }
  } catch (error) {
    console.log("LOOP ERROR:", error);
  }
}
