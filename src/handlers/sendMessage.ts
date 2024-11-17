// used in new src
import { CustomSocket } from "../../types";
import { broadcast } from "../lib/customEmit";
import { decrypt } from "../lib/lock";
import { getTime } from "../lib/utils";
import User from "../models/userModel";
import { Server } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export async function sendMessage(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: CustomSocket,
  message: string
) {
  const { roomInfo, userInfo } = socket;
  if (!roomInfo || !userInfo || !message) throw new Error("Login required");
  const user = await User.findById(userInfo.id).select(
    "imageUrl username name"
  );
  if (decrypt(message).length > 500)
    throw new Error("Maximum Message Size exceeded");
  const payload = {
    user,
    message: decrypt(message),
    time: getTime(),
  };

  broadcast(io, roomInfo?.roomId, "message", payload);
}
