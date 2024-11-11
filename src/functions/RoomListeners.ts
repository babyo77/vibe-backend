import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import Room from "../models/roomModel";
import RoomUser from "../models/roomUsers";
import { VibeCache } from "../cache/cache";

export const roomListeners = async (req: CustomRequest, res: Response) => {
  try {
    const roomId = String(req.query.room) || "";

    if (!roomId) throw new Error("Invalid roomId");
    if (VibeCache.has(roomId + "listeners")) {
      return res.json(VibeCache.get(roomId + "listeners"));
    }
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(400).json({ message: "Invalid roomId" });

    // Fetch active room users and populate user information
    const roomUsers = await RoomUser.find({ roomId: room._id, active: true })
      .populate({
        path: "userId",
        select: "name username imageUrl", // Select only necessary fields
      })
      .limit(17)
      .select("userId -_id");

    // Count the total number of active listeners
    const totalListeners = await RoomUser.countDocuments({
      roomId: room._id,
      active: true,
    });

    const isAdminActive = await RoomUser.exists({
      roomId: room._id,
      role: "admin",
      active: true,
    });
    const payload = {
      totalUsers: totalListeners,
      isAdminActive: isAdminActive ? true : false,
      currentPage: 1,
      roomUsers,
    };
    VibeCache.set(roomId + "listeners", payload);
    res.json(payload);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
