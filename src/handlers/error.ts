import { CustomSocket } from "../../types";

export async function errorHandler(socket: CustomSocket, message: string) {
  socket.emit("error", message);
}
