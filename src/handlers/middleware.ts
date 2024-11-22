// using in new

import { CustomSocket } from "../../types";
import { ExtendedError } from "socket.io/dist/namespace";
import Room from "../models/roomModel";
import jwt from "jsonwebtoken";
import User from "../models/userModel";
import RoomUser from "../models/roomUsers";
import { emitMessage } from "../lib/customEmit";
import { encrypt } from "../lib/lock";
import { getCurrentlyPlaying } from "../lib/utils";
import { VibeCache } from "../cache/cache";
export async function middleware(
  socket: CustomSocket,
  next: (err?: ExtendedError) => void
) {
  try {
    let user = null;
    const token = socket.handshake.query["authorization"];
    const roomId = socket.handshake.query["room"];
    if (!roomId || typeof roomId !== "string" || typeof token !== "string")
      throw new Error("Invalid roomId");
    const isValidRoomId = /^[a-zA-Z0-9]+$/.test(roomId);

    if (roomId.length <= 3) {
      throw new Error("Name is too short, minimum 4 characters");
    }

    if (roomId.length > 11) {
      throw new Error("Name is too large, maximum 11 characters");
    }

    if (!isValidRoomId) {
      throw new Error("Special characters not allowed");
    }

    if (token && token.length > 0) {
      const decode: any = jwt.verify(token, process.env.JWT_SECRET || "");
      user = await User.findById(decode.userId).select("username");
    }

    // const room = await Room.findOne({ roomId });

    // if (!room && !user) throw new Error("Login to claim this Room");

    const newRoom = await Room.findOneAndUpdate(
      { roomId },
      {},
      { new: true, upsert: true }
    );

    socket.join(roomId);
    VibeCache.set(roomId + "roomId", { _id: newRoom._id.toString() });
    socket.roomInfo = {
      roomId: newRoom.roomId,
      _id: newRoom._id.toString(),
      progress: VibeCache.has(newRoom._id.toString() + "progress")
        ? (VibeCache.get(newRoom._id.toString() + "progress") as number)
        : 0,
    };

    if (user) {
      const existingUser = await RoomUser.findOne({
        userId: user._id.toString(),
        roomId: newRoom._id,
      }).select("role");

      let userRole;

      if (existingUser) {
        userRole = existingUser.role;
      } else {
        const users = await RoomUser.countDocuments({ roomId: newRoom._id });
        userRole = users > 0 ? "listener" : "admin";
      }

      const addedUser = await RoomUser.findOneAndUpdate(
        { userId: user._id.toString(), roomId: newRoom._id },
        {
          active: true,
          socketid: socket.id,
          role: userRole,
          status: false,
        },
        { upsert: true, new: true }
      );
      socket.userInfo = {
        id: addedUser.userId.toString(),
        role: addedUser.role,
      };
    }

    socket.emit(
      "joined",
      encrypt({ ...socket.roomInfo, role: socket.userInfo?.role })
    );

    const currentSong = VibeCache.has(socket.roomInfo.roomId + "isplaying")
      ? VibeCache.get(socket.roomInfo.roomId + "isplaying")
      : (
          await getCurrentlyPlaying(socket.roomInfo._id, socket.userInfo?.id)
        )[0];
    if (currentSong) {
      socket.emit("isplaying", encrypt(currentSong));
    }
    socket.emit("profile");
    socket.emit("update");
    emitMessage(
      socket,
      roomId,
      "userJoinedRoom",
      user || { username: "@someone" }
    );
    VibeCache.del(socket.userInfo?.id + "room");
    VibeCache.del(socket.roomInfo?.roomId + "listeners");
    next();
  } catch (error: any) {
    console.log("MIDDLEWARE ERROR:", error);

    throw new Error(error.message);
  }
}
