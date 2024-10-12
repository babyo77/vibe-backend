import { CustomSocket } from "../../types";

import { errorHandler } from "./error";

export async function sendDuration(socket: CustomSocket) {
  try {
    const { progress } = socket;
    if (!progress) return;
    socket.emit("updateProgress", progress);
  } catch (error: any) {
    errorHandler(socket, error.message);
  }
}
