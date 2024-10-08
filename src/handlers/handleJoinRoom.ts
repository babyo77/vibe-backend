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
        active: true,
        socketid: socket.id,
        role:
          totalUsers == 0 ? "admin" : socket.role ? socket.role : "listener",
      },
      { upsert: true, new: true }
    ).populate("userId");

    if (!addedUser) {
      throw new Error("Unable to join room");
    }

    socket.join(roomInfo.roomId);
    const roomUsers = await RoomUser.find({
      roomId: roomInfo._id,
      active: true,
    })
      .populate("userId")
      .limit(5);

    const totalListeners = await RoomUser.countDocuments({
      roomId: roomInfo._id,
      active: true,
    });
    socket.emit("joinedRoom", {
      user: {
        ...addedUser.toObject(),
      },
      listeners: {
        totalUsers: totalListeners,
        currentPage: 1,
        roomUsers,
      },
    });

    socket.to(roomInfo.roomId).emit("userJoinedRoom", {
      user,
      listeners: {
        totalUsers: totalListeners,
        currentPage: 1,
        roomUsers,
      },
    });
  } catch (error: any) {
    console.log("JOIN ERROR:", error.message);
    errorHandler(socket, error.message || "An unexpected error occurred");
  }
}
