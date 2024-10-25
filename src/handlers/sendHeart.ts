// used in new src
import { CustomSocket } from "../../types";
import { emitMessage } from "../lib/customEmit";
import { decrypt } from "../lib/lock";

export async function sendHeart(socket: CustomSocket, data: any) {
  const { roomInfo } = socket;
  if (!roomInfo) return;
  emitMessage(socket, roomInfo.roomId, "heart", decrypt(data));
}
