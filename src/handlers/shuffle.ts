import { CustomSocket } from "../../types";
import { getSongsWithVoteCounts, shuffleArray } from "../lib/utils";
import { errorHandler } from "./error";

export async function shuffle(socket: CustomSocket) {
  try {
    const { roomInfo, role } = socket;
    if (!roomInfo) throw new Error("Invalid room");
    if (role !== "admin") throw new Error("Only admin can shuffle");

    socket.emit("shuffle");
    socket.to(roomInfo.roomId).emit("shuffle");
  } catch (error: any) {
    console.log("Failed to shuffle", error.message);
    errorHandler(socket, error.message);
  }
}
