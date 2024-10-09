import { CustomSocket } from "../../types";
import RoomUser from "../models/roomUsers";
import User from "../models/userModel";
import { errorHandler } from "./error";
import { getListener } from "../lib/utils";

export async function handleJoinRoom(socket: CustomSocket) {
  try {
    const { userId, roomInfo } = socket;

    // Validate user and roomInfo in a single query
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (!roomInfo) {
      throw new Error("Room not found");
    }

    // Update or create room user entry
    const addedUser = await RoomUser.findOneAndUpdate(
      { userId, roomId: roomInfo._id },
      {
        active: true,
        socketid: socket.id,
        role:
          (await RoomUser.countDocuments({ roomId: roomInfo._id })) === 0
            ? "admin"
            : socket.role || "listener",
      },
      { upsert: true, new: true }
    );

    if (!addedUser) {
      throw new Error("Unable to join room");
    }

    socket.join(roomInfo.roomId);

    // Fetch listeners and prepare response data
    const listeners = await getListener(roomInfo._id);
    const userData = {
      ...addedUser.toObject(),
      ...user.toObject(),
    };

    // Emit to the current socket
    socket.emit("joinedRoom", { user: userData, listeners });

    // Emit to other sockets in the room
    socket
      .to(roomInfo.roomId)
      .emit("userJoinedRoom", { user: userData, listeners });
  } catch (error: any) {
    console.error("JOIN ERROR:", error.message);
    errorHandler(socket, error.message || "An unexpected error occurred");
  }
}
