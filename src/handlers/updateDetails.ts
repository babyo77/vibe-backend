import { CustomSocket, updateDetailsT } from "../../types";
import { errorHandler } from "./error";
import Room from "../models/roomModel";
import { emitMessage } from "../lib/customEmit";
import { decrypt } from "tanmayo7lock";

export async function updateDetails(socket: CustomSocket, payload: string) {
  try {
    const { roomInfo, userInfo } = socket;
    if (!roomInfo) throw new Error("Login required");
    if (userInfo?.role !== "admin")
      throw new Error("Only admin is allowed to update room details");

    const data = decrypt(payload) as updateDetailsT;

    if (!data?.action) throw new Error("Action is missing in the data.");

    if (data.action === "updateRoomName") {
      await Room.findByIdAndUpdate(roomInfo._id, { name: data.payload.text });
      emitMessage(
        socket,
        roomInfo.roomId,
        "detailsUpdated",
        `Room name set to ${data.payload.text}`
      );
    }
  } catch (error: any) {
    console.log("UPDATE DETAILS ERROR:", error);
    errorHandler(socket, error.message);
  }
}
