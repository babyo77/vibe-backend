import { CustomSocket } from "../../types";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/userModel";
import Room from "../models/roomModel";
import RoomUser from "../models/roomUsers";
import { ExtendedError } from "socket.io/dist/namespace";
export async function middleware(
  socket: CustomSocket,
  next: (err?: ExtendedError) => void
) {
  try {
    const token = socket.handshake.headers["authorization"];
    const roomId = socket.handshake.headers["room"];
    if (typeof roomId == "string" && roomId.trim() !== "") {
    } else {
      throw new Error("Invalid roomId: " + roomId);
    }
    if (!roomId) throw new Error("roomId not provided");
    if (token && token !== "undefined") {
      const decoded = (await jwt.verify(
        token,
        process.env.JWT_SECRET || ""
      )) as JwtPayload;
      if (decoded && typeof decoded.userId === "string") {
        const user = await User.findById(decoded?.userId);
        if (!user) throw new Error("Could not find user");
        socket.userId = user?._id.toString();
        const room = await Room.findOneAndUpdate(
          { roomId },
          { isActive: true },
          { upsert: true, new: true }
        );
        if (!room) throw new Error("Could not find room");
        const role = await RoomUser.findOne({
          roomId: room?._id,
          userId: user?.id,
        });
        socket.roomInfo = {
          _id: room._id.toString(),
          roomId: room.roomId.toString(),
        };
        socket.progress = room.progress;
        if (role) {
          socket.role = role.role.toString();
        }
      }
    } else {
      const room = await Room.findOne({ roomId });
      socket.roomInfo = {
        _id: room._id.toString(),
        roomId: room.roomId.toString(),
      };
      socket.progress = room.progress;
    }
    socket.compress(true);
    return next();
  } catch (error: any) {
    console.log("MIDDLEWARE ERROR:", error.message);
    if (error.message === "jwt malformed") return;
    return next(new Error(error?.message || "Invalid token"));
  }
}
