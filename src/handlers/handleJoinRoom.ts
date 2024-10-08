import { log } from "console";
import { CustomSocket, joinRoom } from "../../types";
import Room from "../models/roomModel";
import RoomUser from "../models/roomUsers";
import User from "../models/userModel";
import { errorHandler } from "./error";
import mongoose from "mongoose";

export async function handleJoinRoom(socket: CustomSocket) {
  try {
    const { userId, roomInfo } = socket;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!roomInfo) {
      throw new Error("Room not found");
    }

    // Find the total number of documents for pagination metadata
    const totalUsers = await RoomUser.countDocuments({ roomId: roomInfo._id });

    // Update or create room user entry
    const addedUser = await RoomUser.findOneAndUpdate(
      { userId, roomId: roomInfo._id },
      {
        isActive: true,
        socketid: socket.id,
        role:
          totalUsers == 0 ? "admin" : socket.role ? socket.role : "listener",
      },
      { upsert: true, new: true }
    ).populate("userId");

    if (!addedUser) {
      throw new Error("Unable to join room");
    }

    socket.join(roomInfo.roomId.toString());

    socket.emit("joinedRoom", {
      user: {
        ...addedUser.toObject(),
      },
    });

    socket.to(roomInfo.roomId.toString()).emit("userJoinedRoom", {
      user,
    });
  } catch (error: any) {
    console.log("JOIN ERROR:", error.message);
    errorHandler(socket, error.message || "An unexpected error occurred");
  }
}
