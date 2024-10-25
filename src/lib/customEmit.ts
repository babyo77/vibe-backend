import { CustomSocket } from "../../types";
import { encrypt } from "./lock";
import { Server } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export async function emitMessage(
  socket: CustomSocket,
  roomId: string,
  emit: string,
  message: any
) {
  socket.to(roomId).emit(emit, encrypt(message));
}

export async function broadcast(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  roomId: string,
  emit: string,
  message: any
) {
  io.to(roomId).emit(emit, encrypt(message));
}
