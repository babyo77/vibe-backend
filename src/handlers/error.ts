import { CustomSocket } from "../../types";
import { encrypt } from "../lib/lock";

export async function errorHandler(socket: CustomSocket, message?: string) {
  socket.emit("error", encrypt(message || "An unexpected error occurred"));
}
